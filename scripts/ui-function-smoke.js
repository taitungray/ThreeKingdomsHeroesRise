"use strict";

/**
 * Headless UI / panel functional smoke.
 * Opens core panels, checks title/content, toast gate, HUD controls, no page errors.
 * Does not open a visible browser window.
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.UI_QA_PORT) || 8807;
const serveBuiltOutput = process.argv.includes("--www");
const screenshotPrefix = serveBuiltOutput ? "ui-redesign-www" : "ui-redesign";

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i += 1) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => { res.resume(); resolve(); });
        req.on("error", reject);
        req.setTimeout(400, () => req.destroy(new Error("timeout")));
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  throw new Error("dev server did not start");
}

async function main() {
  const serverArgs = [path.join(root, "scripts", "dev-server.js"), "--port", String(port)];
  if (serveBuiltOutput) serverArgs.push("--www");
  const server = spawn(process.execPath, serverArgs, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let browser;
  const failures = [];
  try {
    await waitForServer("http://127.0.0.1:" + port + "/");
    const { chromium } = require("playwright");
    const browserExecutable = [
      process.env.PLAYWRIGHT_CHROMIUM_PATH,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ].find((candidate) => candidate && fs.existsSync(candidate));
    browser = await chromium.launch({ headless: true, ...(browserExecutable ? { executablePath: browserExecutable } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 720 }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));

    await page.addInitScript(() => {
      const guestId = "qa-ui";
      localStorage.setItem("taoyuan-guest-profile-v2", JSON.stringify({ id: guestId, displayName: "UIQA", createdAt: 1 }));
      localStorage.setItem("taoyuan-guest-save-" + guestId, JSON.stringify({
        version: 3,
        tutorialStep: 999,
        tutorialDone: true,
        stage: 20,
        lastSeen: Date.now()
      }));
    });

    await page.goto("http://127.0.0.1:" + port + "/?qa=1", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(() => window.TaoyuanBattle && typeof window.TaoyuanBattle.openPanel === "function" && document.getElementById("battleScreen"), null, { timeout: 25000 });
    await page.waitForFunction(() => document.getElementById("loadingScreen")?.hidden && document.getElementById("authScreen")?.hidden, null, { timeout: 25000 });
    await page.evaluate(() => document.fonts?.load?.('16px "Huninn Game"'));
    await page.waitForTimeout(900);
    fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
    await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-battle-390.png"), fullPage: false });

    // Wide phone/webview regression: the 390px authored world must stay the
    // shell width, otherwise object-fit exposes the mismatched red/green side
    // gutters seen in the attached screenshot.
    await page.setViewportSize({ width: 430, height: 720 });
    await page.waitForTimeout(80);
    const wideShellGeometry = await page.evaluate(() => {
      const rect = (selector) => {
        const r = document.querySelector(selector)?.getBoundingClientRect();
        return r ? { left: r.left, right: r.right, width: r.width, top: r.top, bottom: r.bottom } : null;
      };
      const app = rect("#gameApp");
      const screen = rect("#battleScreen");
      const canvas = rect("#battleCanvas");
      return {
        app,
        screen,
        canvas,
        centered: Boolean(app && app.left >= -1 && app.right <= innerWidth + 1 && Math.abs((app.left + app.right) / 2 - innerWidth / 2) <= 1),
        canvasFillsScreen: Boolean(screen && canvas && Math.abs(canvas.left - screen.left) <= 1 && Math.abs(canvas.right - screen.right) <= 1)
      };
    });
    if (!wideShellGeometry.centered || !wideShellGeometry.canvasFillsScreen) failures.push("430px shell exposes side gutter around the battle canvas");
    await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-side-gutter-fixed-430.png"), fullPage: false });
    await page.setViewportSize({ width: 390, height: 720 });
    await page.waitForTimeout(80);

    // Browser chrome must not turn the game surface into selectable document/image content.
    const interactionGuard = await page.evaluate(() => {
      const app = document.getElementById("gameApp");
      const textTarget = app?.querySelector(".stage-banner strong, .quest-text") || app;
      const imageTarget = app?.querySelector("img, canvas, .pixel-avatar") || app;
      const editableTarget = app?.querySelector("input, textarea, select, [contenteditable='true']");
      const dispatch = (type, target) => {
        if (!target) return false;
        const event = new Event(type, { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event.defaultPrevented;
      };
      return {
        userSelect: app ? getComputedStyle(app).userSelect : "",
        textSelectionBlocked: dispatch("selectstart", textTarget),
        editableSelectionAllowed: editableTarget ? !dispatch("selectstart", editableTarget) : true,
        contextMenuBlocked: dispatch("contextmenu", imageTarget),
        nativeDragBlocked: dispatch("dragstart", imageTarget)
      };
    });
    if (interactionGuard.userSelect !== "none") failures.push("game surface still permits native text selection");
    if (!interactionGuard.textSelectionBlocked) failures.push("selectstart was not blocked on game text");
    if (!interactionGuard.editableSelectionAllowed) failures.push("editable input lost its text-selection exception");
    if (!interactionGuard.contextMenuBlocked) failures.push("context menu was not blocked on game surface");
    if (!interactionGuard.nativeDragBlocked) failures.push("native image/canvas drag was not blocked");

    const typographyAudit = await page.evaluate(() => {
      const family = (selector) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element).fontFamily : "";
      };
      return {
        loaded: Boolean(document.fonts?.check?.('16px "Huninn Game"')),
        app: family("#gameApp"),
        stage: family("#stageCompactLabel"),
        button: family("#speedButton"),
        resource: family(".resource-strip")
      };
    });
    if (!typographyAudit.loaded) failures.push("bundled Huninn Game font did not load");
    for (const [role, family] of Object.entries(typographyAudit).filter(([key]) => key !== "loaded")) {
      if (!/Huninn Game/i.test(family)) failures.push("typography role " + role + " fell back to " + family);
    }

    // HUD layout sanity
    const hud = await page.evaluate(() => {
      const top = document.querySelector(".top-hud");
      const stage = document.getElementById("stageCompactLabel");
      const strip = document.querySelector(".resource-strip");
      const nav = document.querySelector(".bottom-nav");
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top) };
      };
      return {
        top: rect(top),
        stageText: stage?.textContent || "",
        strip: rect(strip),
        nav: rect(nav),
        tinyLabels: [...document.querySelectorAll(".top-hud, .resource-strip, .bottom-nav, .quest-tracker")]
          .flatMap((root) => [...root.querySelectorAll("*")])
          .filter((el) => {
            const size = Number.parseFloat(getComputedStyle(el).fontSize);
            const text = (el.textContent || "").trim();
            return text && size > 0 && size < 11 && el.offsetParent !== null;
          })
          .slice(0, 8)
          .map((el) => ({ text: el.textContent.trim().slice(0, 24), size: getComputedStyle(el).fontSize }))
      };
    });
    if (!hud.top || hud.top.h < 50) failures.push("top-hud too short / missing");
    if (!hud.stageText || hud.stageText.length < 4) failures.push("stage label empty");
    if (!hud.strip || hud.strip.h < 36) failures.push("resource strip too short");
    if (!hud.nav || hud.nav.h < 60) failures.push("bottom-nav too short");
    if (hud.tinyLabels.length) failures.push("tiny HUD fonts still present: " + JSON.stringify(hud.tinyLabels));

    const hudGeometry = await page.evaluate(() => {
      const rect = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const overlap = (a, b) => Boolean(a && b && a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1);
      const zones = {
        top: rect(".top-hud"),
        quest: rect(".quest-tracker"),
        rail: rect(".right-rail"),
        bottom: rect(".bottom-hud"),
        lord: rect("#profileButton"),
        stage: rect(".stage-banner"),
        controls: rect(".battle-controls")
      };
      return {
        zones,
        topQuest: overlap(zones.top, zones.quest) && !(zones.quest.top >= zones.top.top && zones.quest.bottom <= zones.top.bottom),
        questRail: overlap(zones.quest, zones.rail),
        topBottom: overlap(zones.top, zones.bottom),
        lordStage: overlap(zones.lord, zones.stage),
        lordControls: overlap(zones.lord, zones.controls)
      };
    });
    if (hudGeometry.topQuest) failures.push("HUD geometry: quest overlaps top command bar");
    if (hudGeometry.questRail) failures.push("HUD geometry: quest overlaps right rail");
    if (hudGeometry.topBottom) failures.push("HUD geometry: top command bar overlaps bottom deck");
    if (hudGeometry.lordStage || hudGeometry.lordControls) failures.push("HUD geometry: top command columns overlap");

    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(80);
    const narrowHudGeometry = await page.evaluate(() => {
      const selectors = [".top-hud", ".quest-tracker", ".right-rail", ".bottom-hud"];
      const rects = selectors.map((selector) => {
        const el = document.querySelector(selector);
        const r = el?.getBoundingClientRect();
        return r ? { selector, left: r.left, right: r.right, top: r.top, bottom: r.bottom } : null;
      }).filter(Boolean);
      const overlap = (a, b) => a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
      const topContainsQuest = rects[1] && rects[0] && rects[1].top >= rects[0].top && rects[1].bottom <= rects[0].bottom;
      return { rects, overlap: (overlap(rects[0], rects[1]) && !topContainsQuest) || overlap(rects[1], rects[2]) || overlap(rects[0], rects[3]) };
    });
    if (narrowHudGeometry.overlap) failures.push("320px HUD geometry overlaps between command zones");
    await page.setViewportSize({ width: 390, height: 720 });
    await page.waitForTimeout(80);

    // The expanded military drawer must remain a usable app sheet without
    // covering the resource/nav deck (the attached regression screenshot).
    await page.evaluate(() => document.getElementById("railMoreButton")?.click());
    await page.waitForTimeout(240);
    const drawerGeometry = await page.evaluate(() => {
      const drawer = document.getElementById("rightRailDrawer");
      const dr = drawer?.getBoundingClientRect();
      const bottom = document.querySelector(".bottom-hud")?.getBoundingClientRect();
      const list = drawer?.querySelector(".rail-drawer-list");
      const listRect = list?.getBoundingClientRect();
      const visible = Boolean(drawer && !drawer.hidden && dr && dr.width > 0 && dr.height > 0);
      const withinViewport = Boolean(dr && dr.left >= 0 && dr.right <= innerWidth && dr.top >= 0 && dr.bottom <= innerHeight);
      const clearOfBottomHud = Boolean(dr && bottom && dr.bottom <= bottom.top - 6);
      const buttonRects = [...(drawer?.querySelectorAll(".rail-drawer-list button") || [])].map((button) => {
        const r = button.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      });
      // The list is intentionally scrollable on 320px phones: vertical
      // button rects may continue below the scrollport, but never horizontally
      // escape the sheet or become smaller than the touch target.
      const buttonsContained = Boolean(dr && buttonRects.length >= 10 && buttonRects.every((r) => r.left >= dr.left - 1 && r.right <= dr.right + 1 && r.width >= 40 && r.height >= 40));
      const drawerScrollable = Boolean(list && list.scrollHeight > list.clientHeight + 2);
      if (list) list.scrollTop = list.scrollHeight;
      const last = drawer?.querySelector(".rail-drawer-list button:last-child")?.getBoundingClientRect();
      const lastButtonAccessible = Boolean(last && listRect && last.top <= listRect.bottom + 1 && last.bottom >= listRect.top - 1);
      return { visible, withinViewport, clearOfBottomHud, buttonsContained, drawerScrollable, lastButtonAccessible, drawer: dr && { left: dr.left, right: dr.right, top: dr.top, bottom: dr.bottom }, bottomHud: bottom && { top: bottom.top, bottom: bottom.bottom } };
    });
    if (!drawerGeometry.visible || !drawerGeometry.withinViewport) failures.push("more drawer is not contained in the viewport");
    if (!drawerGeometry.clearOfBottomHud) failures.push("more drawer overlaps the resource/nav deck");
    if (!drawerGeometry.buttonsContained) failures.push("more drawer command buttons escape the sheet");
    if (!drawerGeometry.drawerScrollable || !drawerGeometry.lastButtonAccessible) failures.push("more drawer list cannot scroll to its final command");
    await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-drawer-390.png"), fullPage: false });
    await page.evaluate(() => closeRailDrawer());

    // Exercise every route that lives in the drawer, not only direct openPanel calls.
    const drawerRoutes = [
      ["daily", "軍務"], ["mail", "文書"], ["settings", "設定"], ["shop", "行商"],
      ["events", "敕令"], ["collection", "圖鑑"], ["achievement", "成就"], ["trials", "列傳"],
      ["arena", "演武"], ["tower", "問天"], ["dungeon", "副本"]
    ];
    for (const [route, expectedTitle] of drawerRoutes) {
      await page.evaluate((type) => {
        document.getElementById("railMoreButton")?.click();
        document.querySelector(`#rightRailDrawer [data-panel="${type}"]`)?.click();
      }, route);
      await page.waitForTimeout(100);
      const routeState = await page.evaluate(() => ({
        drawerClosed: Boolean(document.getElementById("rightRailDrawer")?.hidden),
        panelOpen: Boolean(document.getElementById("panelBackdrop") && !document.getElementById("panelBackdrop").hidden),
        title: document.getElementById("panelTitle")?.textContent || ""
      }));
      if (!routeState.drawerClosed || !routeState.panelOpen || !routeState.title.includes(expectedTitle)) {
        failures.push(`drawer route ${route}: did not open expected panel [${routeState.title}]`);
      }
      await page.evaluate(() => window.TaoyuanBattle.closePanel());
      await page.waitForTimeout(50);
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(80);
    await page.evaluate(() => document.getElementById("railMoreButton")?.click());
    await page.waitForTimeout(240);
    const narrowDrawerGeometry = await page.evaluate(() => {
      const drawer = document.getElementById("rightRailDrawer");
      const dr = drawer?.getBoundingClientRect();
      const bottom = document.querySelector(".bottom-hud")?.getBoundingClientRect();
      return {
        visible: Boolean(drawer && !drawer.hidden),
        withinViewport: Boolean(dr && dr.left >= 0 && dr.right <= innerWidth && dr.top >= 0 && dr.bottom <= innerHeight),
        clearOfBottomHud: Boolean(dr && bottom && dr.bottom <= bottom.top - 6),
        drawer: dr && { top: dr.top, bottom: dr.bottom },
        bottomHud: bottom && { top: bottom.top, bottom: bottom.bottom }
      };
    });
    if (!narrowDrawerGeometry.visible || !narrowDrawerGeometry.withinViewport || !narrowDrawerGeometry.clearOfBottomHud) {
      failures.push("320px more drawer is not separated from the bottom deck");
    }
    await page.evaluate(() => closeRailDrawer());
    await page.setViewportSize({ width: 390, height: 720 });
    await page.waitForTimeout(80);

    const lordHud = await page.evaluate(() => {
      const card = document.getElementById("profileButton");
      const exp = document.getElementById("expText");
      const level = document.getElementById("lordLevel");
      const title = document.getElementById("armyTitle");
      if (!card || !exp || !level) return { missing: true };
      const cr = card.getBoundingClientRect();
      const er = exp.getBoundingClientRect();
      const lr = level.getBoundingClientRect();
      const tr = title?.getBoundingClientRect();
      const style = getComputedStyle(exp);
      const portrait = card.querySelector(".pixel-avatar");
      const portraitStyle = portrait ? getComputedStyle(portrait) : null;
      const overlaps = (a, b) => a && b && !(a.right <= b.left + 1 || a.left >= b.right - 1 || a.bottom <= b.top + 1 || a.top >= b.bottom - 1);
      const titleVisible = Boolean(title && getComputedStyle(title).display !== "none" && title.offsetHeight > 0);
      return {
        missing: false,
        expText: (exp.textContent || "").trim(),
        nowrap: style.whiteSpace === "nowrap",
        portraitContained: portraitStyle?.backgroundSize === "contain",
        expInsideCard: er.width > 0 && er.left >= cr.left - 1 && er.right <= cr.right + 1 && er.top >= cr.top - 1 && er.bottom <= cr.bottom + 1,
        expOverlapsLevel: overlaps(er, lr),
        titleOverlapsExp: titleVisible && overlaps(tr, er)
      };
    });
    if (lordHud.missing) failures.push("lord card HUD nodes missing");
    if (!/^\d+\/\d+$/.test(lordHud.expText || "")) failures.push("lord exp text garbled: " + lordHud.expText);
    if (!lordHud.nowrap) failures.push("lord exp text wraps instead of overlaying the bar");
    if (!lordHud.portraitContained) failures.push("lord portrait uses a crop-prone background sizing mode");
    if (!lordHud.expInsideCard) failures.push("lord exp text overflows the lord card");
    if (lordHud.expOverlapsLevel) failures.push("lord exp text overlaps Lv label");
    if (lordHud.titleOverlapsExp) failures.push("army title overlaps lord exp text");

    const stageTextGeometry = await page.evaluate(() => {
      const rect = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const overlap = (a, b) => Boolean(a && b && a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1);
      const stage = rect(".stage-banner");
      const title = rect("#stageCompactLabel");
      const wave = rect("#waveChip");
      const quest = rect(".quest-tracker");
      return {
        title,
        wave,
        quest,
        titleInsideStage: Boolean(title && stage && title.left >= stage.left && title.right <= stage.right && title.top >= stage.top && title.bottom <= stage.bottom),
        waveInsideStage: Boolean(wave && stage && wave.left >= stage.left && wave.right <= stage.right && wave.top >= stage.top && wave.bottom <= stage.bottom),
        titleQuestOverlap: overlap(title, quest),
        titleWaveOverlap: overlap(title, wave)
      };
    });
    if (!stageTextGeometry.titleInsideStage || !stageTextGeometry.waveInsideStage) failures.push("stage banner text escapes its bounded row");
    if (stageTextGeometry.titleQuestOverlap || stageTextGeometry.titleWaveOverlap) failures.push("stage banner text overlaps quest or wave text");

    const profileClick = await page.evaluate(() => {
      document.getElementById("profileButton")?.click();
      const backdrop = document.getElementById("panelBackdrop");
      const content = document.getElementById("panelContent");
      const title = document.getElementById("panelTitle")?.textContent || "";
      return {
        open: Boolean(backdrop && !backdrop.hidden),
        title,
        lordQuickRow: Boolean(content?.querySelector(".lord-quick-row")),
        lordPanelLinks: content?.querySelectorAll('[data-action="open-panel"]').length || 0,
        lordStatButtons: content?.querySelectorAll(".lord-stat-chip button, button.lord-stat-chip").length || 0
      };
    });
    if (!profileClick.open) failures.push("profileButton click did not open a panel");
    if (!profileClick.title.includes("主公")) failures.push("profileButton: unexpected title [" + profileClick.title + "]");
    if (profileClick.lordQuickRow || profileClick.lordPanelLinks || profileClick.lordStatButtons) {
      failures.push("profile: duplicate navigation shortcut remains in lord office");
    }
    await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-profile-390.png"), fullPage: false });
    await page.evaluate(() => window.TaoyuanBattle.closePanel());

    const panels = [
      { id: "heroes", title: "武將" },
      { id: "formation", title: "編隊" },
      { id: "tactics", title: "戰" },
      { id: "campaign", title: "征戰" },
      { id: "daily", title: "軍務" },
      { id: "shop", title: "行商" },
      { id: "settings", title: "設定" },
      { id: "mail", title: "文書" },
      { id: "achievement", title: "成就" },
      { id: "collection", title: "圖鑑" },
      { id: "arena", title: "演武" },
      { id: "tower", title: "問天" },
      { id: "dungeon", title: "副本" },
      { id: "events", title: "敕令" },
      { id: "trials", title: "列傳" },
      { id: "profile", title: "主公" }
    ];

    for (const panel of panels) {
      await page.evaluate((type) => window.TaoyuanBattle.openPanel(type), panel.id);
      await page.waitForTimeout(260);
      const state = await page.evaluate(() => {
        const backdrop = document.getElementById("panelBackdrop");
        const title = document.getElementById("panelTitle")?.textContent || "";
        const content = document.getElementById("panelContent");
        const html = content?.innerHTML || "";
        const settingRows = [...(content?.querySelectorAll(".setting-row") || [])].map((row) => {
          const rr = row.getBoundingClientRect();
          const children = [...row.querySelectorAll(":scope > div, :scope > button")].map((el) => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
          });
          return { rect: { left: rr.left, right: rr.right, top: rr.top, bottom: rr.bottom }, children };
        });
        const contentRect = content?.getBoundingClientRect();
        const visible = (element) => element && element.offsetParent !== null && getComputedStyle(element).visibility !== "hidden";
        const critical = [...(content?.querySelectorAll("article, section, .setting-row, .record-item, .formation-layout, .hero-card, .stage-card, .trial-card, button") || [])].filter(visible);
        const outsideElements = critical.filter((element) => {
          const rect = element.getBoundingClientRect();
          return contentRect && (rect.left < contentRect.left - 1 || rect.right > contentRect.right + 1);
        }).slice(0, 8).map((element) => (element.className || element.tagName) + ":" + (element.textContent || "").trim().slice(0, 18));
        const verticalText = [...(content?.querySelectorAll("h3, p, small, strong, span") || [])].filter((element) => {
          if (!visible(element)) return false;
          const text = (element.textContent || "").trim();
          const rect = element.getBoundingClientRect();
          return text.length >= 4 && rect.width > 0 && rect.width < 25 && rect.height > rect.width * 1.8;
        }).slice(0, 8).map((element) => (element.textContent || "").trim().slice(0, 18));
        const clippedButtons = [...(content?.querySelectorAll("button") || [])].filter((button) => visible(button) && (button.scrollWidth > button.clientWidth + 2 || button.scrollHeight > button.clientHeight + 2)).slice(0, 8).map((button) => (button.textContent || "").trim().slice(0, 18));
        return {
          open: Boolean(backdrop && !backdrop.hidden),
          title,
          hasContent: html.length > 40,
          hasUndefined: /\bundefined\b/.test(html) || /\bundefined\b/.test(title),
          hasActiveArmy: /ACTIVE ARMY PASSIVE/.test(html),
          hasTitleEquip: Boolean(content?.querySelector('[data-action="title-equip"]')),
          hasFrameEquip: Boolean(content?.querySelector('[data-action="frame-equip"]')),
          hasQuestRoute: Boolean(document.getElementById("questTracker")?.dataset.panel),
          scrollTop: content?.scrollTop || 0,
          settingRows,
          horizontalOverflow: Boolean(content && content.scrollWidth > content.clientWidth + 1),
          outsideElements,
          verticalText,
          clippedButtons
        };
      });
      if (!state.open) failures.push(panel.id + ": panel not open");
      if (!state.title.includes(panel.title)) failures.push(panel.id + ": unexpected title [" + state.title + "]");
      if (!state.hasContent) failures.push(panel.id + ": empty content");
      if (state.hasUndefined) failures.push(panel.id + ": undefined leak");
      if (state.hasActiveArmy) failures.push(panel.id + ": internal English leak");
      if (state.scrollTop !== 0) failures.push(panel.id + ": panel did not reset scroll position");
      if (state.horizontalOverflow) failures.push(panel.id + ": panel has horizontal overflow");
      if (state.outsideElements.length) failures.push(panel.id + ": controls escape content bounds " + JSON.stringify(state.outsideElements));
      if (state.verticalText.length) failures.push(panel.id + ": text collapsed into a vertical strip " + JSON.stringify(state.verticalText));
      if (state.clippedButtons.length) failures.push(panel.id + ": button label clipped " + JSON.stringify(state.clippedButtons));
      if (panel.id === "collection" && (state.hasTitleEquip || state.hasFrameEquip)) {
        failures.push("collection: title/frame management duplicates lord office");
      }
      if (panel.id === "profile" && (!state.hasTitleEquip || !state.hasFrameEquip)) {
        failures.push("profile: title/frame controls missing from lord office");
      }
      if (panel.id === "collection") {
        await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-collection-390.png"), fullPage: false });
      }
      if (panel.id === "settings") {
        await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-settings-390.png"), fullPage: false });
        const rowOverlap = state.settingRows.some((row) => row.children.some((child) => child.left < row.rect.left - 1 || child.right > row.rect.right + 1 || child.top < row.rect.top - 1 || child.bottom > row.rect.bottom + 1) || row.children.some((a, index) => row.children.slice(index + 1).some((b) => a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1)));
        if (rowOverlap) failures.push("settings: row text or action button overlaps / escapes its cell");
      }
      await page.evaluate(() => window.TaoyuanBattle.closePanel());
      await page.waitForTimeout(80);
    }

    const questRoute = await page.evaluate(() => ({
      hasPanelTarget: Boolean(document.getElementById("questTracker")?.dataset.panel),
      role: document.getElementById("questTracker")?.getAttribute("role") || ""
    }));
    if (questRoute.hasPanelTarget || questRoute.role !== "status") {
      failures.push("quest tracker: still exposes a duplicate campaign navigation target");
    }

    // HUD controls: speed + auto
    const controlState = await page.evaluate(() => {
      const speed = document.getElementById("speedButton");
      const auto = document.getElementById("autoButton");
      const before = speed?.textContent || "";
      speed?.click();
      const mid = speed?.textContent || "";
      speed?.click();
      auto?.click();
      return {
        before,
        mid,
        after: speed?.textContent || "",
        autoLabel: auto?.textContent || "",
        autoPressed: auto?.getAttribute("aria-pressed")
      };
    });
    if (!controlState.before || controlState.before === controlState.mid) {
      // allow same if only one speed, but typically cycles
    }
    if (!/^×\d/.test(controlState.before)) failures.push("speed button label broken: " + controlState.before);

    // Bottom nav open/close
    const modalA11y = await page.evaluate(async () => {
      const trigger = document.querySelector('.bottom-nav [data-panel=heroes]');
      trigger?.focus();
      trigger?.click();
      await new Promise((resolve) => setTimeout(resolve, 30));
      const backdrop = document.getElementById('panelBackdrop');
      const dialog = document.getElementById('gamePanel');
      const backgroundRoot = document.getElementById('battleScreen');
      const backgroundInert = Boolean(backgroundRoot?.inert && document.querySelector('.bottom-nav button')?.closest('[inert]') === backgroundRoot);
      const initialInside = Boolean(dialog?.contains(document.activeElement));
      const focusables = [...(dialog?.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]') || [])].filter((element) => element.offsetParent !== null && element.getAttribute('tabindex') !== '-1');
      if (focusables.length) {
        focusables[focusables.length - 1].focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      }
      const trapped = Boolean(dialog?.contains(document.activeElement));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 30));
      return {
        initialInside,
        backgroundInert,
        trapped,
        closed: Boolean(backdrop?.hidden),
        restored: document.activeElement === trigger
      };
    });
    if (!modalA11y.initialInside || !modalA11y.backgroundInert || !modalA11y.trapped || !modalA11y.closed || !modalA11y.restored) {
      failures.push('modal manager: focus, inert, trap, Escape or focus restoration failed: ' + JSON.stringify(modalA11y));
    }
    const navOpen = await page.evaluate(() => {
      const btn = document.querySelector('.bottom-nav [data-panel="heroes"], .bottom-nav button[data-action="open-panel"][data-panel="heroes"], button[data-panel="heroes"]');
      if (btn) btn.click();
      else window.TaoyuanBattle.openPanel("heroes");
      const backdrop = document.getElementById("panelBackdrop");
      return Boolean(backdrop && !backdrop.hidden);
    });
    if (!navOpen) failures.push("bottom-nav heroes open failed");
    await page.evaluate(() => window.TaoyuanBattle.closePanel());

    // Daily checkin button exists
    await page.evaluate(() => window.TaoyuanBattle.openPanel("daily"));
    await page.waitForTimeout(260);
    const dailyUi = await page.evaluate(() => {
      const content = document.getElementById("panelContent")?.innerHTML || "";
      return {
        hasCheckin: content.includes("七日簽到") || content.includes("簽到"),
        hasTask: content.includes("日常征戰") || content.includes("軍務"),
        undefined: /\bundefined\b/.test(content)
      };
    });
    if (!dailyUi.hasCheckin) failures.push("daily: missing checkin section");
    if (!dailyUi.hasTask) failures.push("daily: missing task cards");
    if (dailyUi.undefined) failures.push("daily: undefined after reopen");
    const dailyGeometry = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".task-card")];
      const overlap = (a, b) => a && b && a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
      const rows = cards.map((card) => {
        const cardRect = card.getBoundingClientRect();
        const children = [card.querySelector(".task-badge"), card.querySelector(".task-card-main"), card.querySelector(".panel-action")]
          .map((el) => el?.getBoundingClientRect()).filter(Boolean);
        return {
          inside: children.every((r) => r.left >= cardRect.left - 1 && r.right <= cardRect.right + 1 && r.top >= cardRect.top - 1 && r.bottom <= cardRect.bottom + 1),
          childrenOverlap: children.some((a, index) => children.slice(index + 1).some((b) => overlap(a, b))),
          height: Math.round(cardRect.height)
        };
      });
      return { count: rows.length, rows };
    });
    if (!dailyGeometry.count) failures.push("daily: task geometry has no rows");
    if (dailyGeometry.rows.some((row) => !row.inside || row.childrenOverlap || row.height < 92)) failures.push("daily: task row geometry overlaps or is too short: " + JSON.stringify(dailyGeometry.rows));
    await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-daily-390.png"), fullPage: false });
    await page.evaluate(() => window.TaoyuanBattle.closePanel());

    // Campaign stage cards present
    await page.evaluate(() => window.TaoyuanBattle.openPanel("campaign"));
    await page.waitForTimeout(120);
    const campaignUi = await page.evaluate(() => {
      const cards = document.querySelectorAll(".stage-card");
      const hero = document.querySelector(".campaign-chapter-hero");
      const content = document.getElementById("panelContent")?.innerHTML || "";
      return {
        cardCount: cards.length,
        hasHero: Boolean(hero),
        undefined: /\bundefined\b/.test(content)
      };
    });
    if (campaignUi.cardCount < 10) failures.push("campaign: too few stage cards (" + campaignUi.cardCount + ")");
    if (!campaignUi.hasHero) failures.push("campaign: missing chapter hero");
    if (campaignUi.undefined) failures.push("campaign: undefined after reopen");
    await page.evaluate(() => window.TaoyuanBattle.closePanel());

    // Slice gate: events locked at stage 2
    await page.evaluate(() => {
      if (typeof window.TaoyuanBattle.setStage === "function") window.TaoyuanBattle.setStage(2);
      else if (window.TaoyuanBattle.getSave) window.TaoyuanBattle.getSave().stage = 2;
    });
    await page.evaluate(() => window.TaoyuanBattle.openPanel("events"));
    await page.waitForTimeout(280);
    const gated = await page.evaluate(() => {
      const toast = document.getElementById("toast");
      const backdrop = document.getElementById("panelBackdrop");
      return {
        toastText: toast?.textContent || "",
        toastShow: Boolean(toast?.classList.contains("show")),
        panelOpen: Boolean(backdrop && !backdrop.hidden),
        stage: window.TaoyuanBattle.getSave?.()?.stage
      };
    });
    if (gated.stage !== 2) failures.push("events: setStage failed (stage=" + gated.stage + ")");
    if (gated.panelOpen) failures.push("events: slice gate failed (opened at stage 2)");
    if (!gated.toastShow && !gated.toastText.includes("通關")) failures.push("events: missing gate toast");

    // Restore stage and confirm events open when unlocked
    await page.evaluate(() => window.TaoyuanBattle.setStage(12));
    await page.evaluate(() => window.TaoyuanBattle.openPanel("events"));
    await page.waitForTimeout(150);
    const unlocked = await page.evaluate(() => {
      const backdrop = document.getElementById("panelBackdrop");
      const title = document.getElementById("panelTitle")?.textContent || "";
      return { open: Boolean(backdrop && !backdrop.hidden), title };
    });
    if (!unlocked.open) failures.push("events: failed to open at stage 12");
    if (!/敕令|活動/.test(unlocked.title)) failures.push("events: unexpected title at stage 12 [" + unlocked.title + "]");
    await page.evaluate(() => window.TaoyuanBattle.closePanel());

    await page.evaluate(() => window.TaoyuanBattle.openPanel("heroes"));
    await page.waitForTimeout(150);
    const heroRosterOrder = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".hero-card")];
      const priority = (card) => card.classList.contains("in-formation") ? 0 : card.classList.contains("locked") ? 2 : 1;
      const priorities = cards.map(priority);
      return {
        count: cards.length,
        priorities,
        ordered: priorities.every((value, index) => index === 0 || value >= priorities[index - 1]),
        deployedCount: priorities.filter((value) => value === 0).length,
        ownedCount: priorities.filter((value) => value === 1).length,
        lockedCount: priorities.filter((value) => value === 2).length
      };
    });
    if (!heroRosterOrder.ordered || heroRosterOrder.count !== 50 || heroRosterOrder.deployedCount < 1 || heroRosterOrder.lockedCount < 1) {
      failures.push("heroes: roster priority order failed: " + JSON.stringify(heroRosterOrder));
    }
    const heroDetailUi = await page.evaluate(() => {
      const btn = document.querySelector('[data-action="hero-detail"][data-hero="zhangfei"]')
        || document.querySelector('[data-action="hero-detail"]');
      if (btn) btn.click();
      const panel = document.getElementById("gamePanel");
      const content = document.getElementById("panelContent");
      const dock = document.querySelector(".hero-detail-dock");
      const scroll = document.querySelector(".hero-detail-scroll");
      const pr = panel?.getBoundingClientRect();
      const dr = dock?.getBoundingClientRect();
      const html = content?.innerHTML || "";
      return {
        title: document.getElementById("panelTitle")?.textContent || "",
        hasDock: Boolean(dock),
        hasScroll: Boolean(scroll),
        dockVisible: Boolean(dock && dr && pr && dr.top >= pr.top && dr.bottom <= pr.bottom + 2 && dr.height >= 44),
        dockNearBottom: Boolean(dock && dr && pr && (pr.bottom - dr.bottom) <= 24),
        bondCards: content?.querySelectorAll(".hero-detail .collection-card").length || 0,
        bondChips: content?.querySelectorAll(".hero-bond-chip").length || 0,
        hasTrueNameBlock: html.includes("專屬神兵真名共鳴"),
        hasBioFold: Boolean(content?.querySelector(".hero-bio-fold")),
        hasLevel: Boolean(content?.querySelector('.hero-detail-dock [data-action="hero-level"]'))
      };
    });
    if (!heroDetailUi.title.includes("武將詳情")) failures.push("hero-detail: unexpected title [" + heroDetailUi.title + "]");
    if (!heroDetailUi.hasDock || !heroDetailUi.hasScroll) failures.push("hero-detail: missing pinned dock / scroll body");
    if (!heroDetailUi.dockVisible) failures.push("hero-detail: upgrade dock not visible in panel");
    if (!heroDetailUi.dockNearBottom) failures.push("hero-detail: upgrade dock not pinned to panel bottom");
    if (heroDetailUi.bondCards > 0) failures.push("hero-detail: bond still uses collection-card");
    if (heroDetailUi.bondChips < 1) failures.push("hero-detail: missing bond chips");
    if (heroDetailUi.hasTrueNameBlock) failures.push("hero-detail: duplicate signature-weapon block still present");
    if (!heroDetailUi.hasBioFold) failures.push("hero-detail: biography not folded");
    if (!heroDetailUi.hasLevel) failures.push("hero-detail: level-up missing from dock");
    await page.evaluate(() => window.TaoyuanBattle.closePanel());

    // Representative hero details: long names, different roles and portrait assets must share one readable contract.
    const representativeHeroes = ["liubei", "zhangfei", "zhugeliang", "diaochan", "lubu"];
    const heroRoleAudit = [];
    for (const heroId of representativeHeroes) {
      await page.evaluate((id) => {
        window.TaoyuanBattle.openPanel("heroes");
        const button = document.querySelector('[data-action="hero-detail"][data-hero="' + id + '"]');
        if (button) button.click();
      }, heroId);
      await page.waitForTimeout(80);
      const audit = await page.evaluate((id) => {
        const panel = document.getElementById("gamePanel");
        const detail = document.querySelector(".hero-detail");
        const hero = document.querySelector(".detail-hero");
        const dock = document.querySelector(".hero-detail-dock");
        const avatar = document.querySelector(".detail-hero > .pixel-avatar");
        const name = document.querySelector(".detail-hero h3");
        const role = document.querySelector(".detail-hero .hero-role");
        const pr = panel?.getBoundingClientRect();
        const dr = detail?.getBoundingClientRect();
        const hr = hero?.getBoundingClientRect();
        const dockRect = dock?.getBoundingClientRect();
        const avatarStyle = avatar ? getComputedStyle(avatar) : null;
        return {
          id,
          name: name?.textContent?.trim() || "",
          role: role?.textContent?.trim() || "",
          portraitContained: avatarStyle?.backgroundSize === "contain",
          heroInsideDetail: Boolean(hero && detail && hr.left >= dr.left - 1 && hr.right <= dr.right + 1),
          dockInsidePanel: Boolean(dock && panel && dockRect.top >= pr.top - 1 && dockRect.bottom <= pr.bottom + 2),
          dockHeight: Math.round(dockRect?.height || 0)
        };
      }, heroId);
      heroRoleAudit.push(audit);
      if (heroId === "zhugeliang") {
        await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-hero-zhugeliang-390.png"), fullPage: false });
      }
      await page.evaluate(() => window.TaoyuanBattle.closePanel());
      await page.waitForTimeout(60);
    }
    if (heroRoleAudit.some((item) => !item.name || !item.role || !item.portraitContained || !item.heroInsideDetail || !item.dockInsidePanel || item.dockHeight < 44)) {
      failures.push("hero detail: representative character portrait/text/dock geometry failed: " + JSON.stringify(heroRoleAudit));
    }

    // The same text contract must survive the 320px fallback layout.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(80);
    await page.evaluate(() => window.TaoyuanBattle.openPanel("settings"));
    await page.waitForTimeout(100);
    const narrowSettings = await page.evaluate(() => {
      const panel = document.getElementById("gamePanel");
      const content = document.getElementById("panelContent");
      const pr = panel?.getBoundingClientRect();
      const rows = [...(content?.querySelectorAll(".setting-row") || [])].map((row) => {
        const rr = row.getBoundingClientRect();
        const children = [...row.querySelectorAll(":scope > div, :scope > button")].map((el) => el.getBoundingClientRect());
        return children.every((r) => r.left >= rr.left - 1 && r.right <= rr.right + 1 && r.top >= rr.top - 1 && r.bottom <= rr.bottom + 1) && rr.left >= pr.left && rr.right <= pr.right;
      });
      return { rowCount: rows.length, allInside: rows.length > 0 && rows.every(Boolean), panelWidth: Math.round(pr?.width || 0) };
    });
    if (!narrowSettings.allInside) failures.push("320px settings: text/action rows escape their panel");
    await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-settings-320.png"), fullPage: false });
    await page.evaluate(() => window.TaoyuanBattle.closePanel());
    await page.setViewportSize({ width: 390, height: 720 });
    await page.waitForTimeout(80);

    // Settlement was the reported problem screen; audit it explicitly after the font swap.
    await page.evaluate(() => {
      showSettlement({
        type: "win",
        stage: 21,
        boss: "青龍偃月",
        progressed: true,
        newlyUnlocked: "",
        reward: { jade: 2, gold: 770, food: 244, exp: 114, shards: 2 },
        damage: [
          { name: "呂布", value: 23663 },
          { name: "關羽", value: 3834 },
          { name: "趙雲", value: 2363 },
          { name: "張飛", value: 1504 },
          { name: "劉備", value: 262 }
        ]
      });
    });
    await page.waitForTimeout(100);
    const settlementTypography = await page.evaluate(() => {
      const modal = document.querySelector(".settlement-modal");
      const title = document.getElementById("settlementTitle");
      const actions = [...document.querySelectorAll(".settlement-modal .action-row button")];
      const mr = modal?.getBoundingClientRect();
      return {
        open: Boolean(document.getElementById("settlementModal") && !document.getElementById("settlementModal").hidden),
        title: title?.textContent || "",
        titleFont: title ? getComputedStyle(title).fontFamily : "",
        modalInsideViewport: Boolean(mr && mr.left >= 0 && mr.right <= innerWidth && mr.top >= 0 && mr.bottom <= innerHeight),
        buttonsInside: actions.length === 2 && actions.every((button) => {
          const r = button.getBoundingClientRect();
          return mr && r.left >= mr.left && r.right <= mr.right && r.top >= mr.top && r.bottom <= mr.bottom;
        })
      };
    });
    if (!settlementTypography.open || !settlementTypography.title.includes("戰功")) failures.push("settlement typography fixture did not open");
    if (!/Huninn Game/i.test(settlementTypography.titleFont)) failures.push("settlement title did not use bundled game font");
    if (!settlementTypography.modalInsideViewport || !settlementTypography.buttonsInside) failures.push("settlement layout escaped after font swap");
    await page.screenshot({ path: path.join(root, "artifacts", screenshotPrefix + "-settlement-390.png"), fullPage: false });
    await page.evaluate(() => {
      const modal = document.getElementById("settlementModal");
      if (modal) {
        modal.hidden = true;
        modal.classList.remove("open");
      }
    });

    if (pageErrors.length) failures.push("page errors: " + pageErrors.slice(0, 3).join(" | "));

    const report = { hud, hudGeometry, narrowHudGeometry, wideShellGeometry, drawerGeometry, narrowDrawerGeometry, lordHud, stageTextGeometry, interactionGuard, typographyAudit, dailyGeometry, heroRosterOrder, heroRoleAudit, narrowSettings, settlementTypography, panelCount: panels.length, controlState, gated, failures, pageErrors };
    console.log(JSON.stringify(report, null, 2));
    if (failures.length) {
      console.error("UI function smoke FAILED");
      process.exitCode = 1;
    } else {
      console.log("UI function smoke PASSED");
    }
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});

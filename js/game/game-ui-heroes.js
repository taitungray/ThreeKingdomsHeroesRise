/* UI Heroes: roster, hero detail, star/breakthrough, paper-doll, formation and tactics */
"use strict";

const HERO_SKILL_META = {
  liubei: { effect: "全隊治療 12%", area: "全隊" },
  guanyu: { effect: "2.05 倍青龍斬", area: "近戰" },
  zhangfei: { effect: "1.7 倍震地傷害", area: "半徑 180" },
  zhaoyun: { effect: "龍膽突進連刺", area: "直線" },
  huangzhong: { effect: "延遲神箭 2.4 倍", area: "遠程" },
  sunshang: { effect: "扇形箭雨", area: "遠程範圍" },
  caocao: { effect: "全隊攻速 +16%", area: "全隊" },
  xiahoudun: { effect: "獲得 25% 減傷", area: "自身" },
  zhugeliang: { effect: "連鎖雷擊 25%", area: "敵方範圍" },
  diaochan: { effect: "標記並魅惑敵人", area: "單體" },
  lubu: { effect: "全屏 2.4 倍傷害", area: "半徑 210" },
  locked: { effect: "尚未解鎖", area: "未知" }
};

function avatarHtml(hero, full = false) {
  const portraitClass = hero?.portrait ? " portrait-asset" : "";
  const portraitStyle = hero?.portrait ? " style=\"background-image:url('" + hero.portrait + "')\"" : "";
  return '<span class="pixel-avatar ' + hero.avatar + portraitClass + (full ? " full" : "") + '"' + portraitStyle + '><i></i><span class="portrait-eyes" aria-hidden="true"></span><span class="avatar-detail" aria-hidden="true"></span></span>';
}

function heroCardHtml(hero, action = "hero-detail") {
  const level = save.heroLevels[hero.id] || 1;
  const inFormation = save.formation.includes(hero.id);
  const unlocked = isUnlocked(hero);
  const equipment = heroEquipmentStats(hero.id);
  const growth = heroGrowthMultiplier(hero.id);
  const power = Math.round(((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp + (hero.def + equipment.def) * 12) * (1 + level * 0.13) * growth);
  const synergy = equipmentSynergyTier(hero.id);

  return '<article class="hero-card ' + (inFormation ? "in-formation" : "") + (unlocked ? "" : " locked") + '" data-hero="' + hero.id + '">' +
    avatarHtml(hero) +
    '<div class="hero-card-body">' +
      '<span class="hero-name">' + hero.name + (synergy.tier > 0 ? '<small style="color:var(--gold,#d7b84f);margin-left:4px;">[' + synergy.name + ']</small>' : '') + '</span>' +
      '<span class="hero-role">' + hero.role + ' · ' + (unlocked ? "Lv." + level : "第 " + hero.unlock + " 關") + '</span>' +
      '<span class="hero-power">' + (unlocked ? formatNumber(power) : "尚待相遇") + '</span>' +
    '</div>' +
    '<button class="' + (unlocked ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="' + action + '" data-hero="' + hero.id + '">' +
      (action === "formation-toggle" ? (inFormation ? "撤下" : "出戰") : (unlocked ? "詳情" : "預覽")) +
    '</button>' +
  '</article>';
}

function renderHeroes(filter = runtime.heroFilter) {
  runtime.heroSort ||= save.heroSort || "power";
  runtime.heroFilter = filter;
  $("heroNotice").hidden = true;
  const powerOf = (hero) => {
    const equipment = heroEquipmentStats(hero.id);
    return Math.round((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp + (hero.def + equipment.def) * 12 + (save.heroLevels[hero.id] || 1) * 48);
  };
  const heroes = HEROES.filter((hero) => filter === "owned" ? isUnlocked(hero) : filter === "locked" ? !isUnlocked(hero) : true).sort((a, b) => {
    if (runtime.heroSort === "level") return (save.heroLevels[b.id] || 0) - (save.heroLevels[a.id] || 0);
    if (runtime.heroSort === "role") return String(a.role).localeCompare(String(b.role));
    return powerOf(b) - powerOf(a);
  });
  const tabs = '<div class="panel-tabs">' +
    '<button type="button" data-action="hero-filter" data-filter="all" class="' + (filter === "all" ? "active" : "") + '">全部</button>' +
    '<button type="button" data-action="hero-filter" data-filter="owned" class="' + (filter === "owned" ? "active" : "") + '">已擁有</button>' +
    '<button type="button" data-action="hero-filter" data-filter="locked" class="' + (filter === "locked" ? "active" : "") + '">未相遇</button>' +
    '</div>';
  const sortRow = '<div class="hero-sort-row"><span>排序</span><button type="button" data-action="hero-sort" data-sort="power" class="' + (runtime.heroSort === "power" ? "active" : "") + '">戰力</button><button type="button" data-action="hero-sort" data-sort="level" class="' + (runtime.heroSort === "level" ? "active" : "") + '">等級</button><button type="button" data-action="hero-sort" data-sort="role" class="' + (runtime.heroSort === "role" ? "active" : "") + '">兵種</button></div>';
  setPanel("武將名冊", tabs + sortRow +
    '<p class="section-caption">不抽卡 · 依戰役結識名將</p>' +
    '<div class="hero-grid">' + heroes.map((hero) => heroCardHtml(hero)).join("") + '</div>' +
    '<p class="section-caption">軍中提示</p>' +
    '<div class="record-item">完成歷史關卡即可讓名將加入。升級只消耗征戰取得的銅錢，不需要抽取重複角色。點選未相遇名將可預覽滿星滿級數值。</div>');
}

function paperDollHtml(hero) {
  const slots = PAPER_DOLL_SLOTS.map((slot) => {
    const item = paperDollItem(hero.id, slot.id);
    const owned = isEquipmentOwned(slot.id, item.id);
    return '<button class="paper-slot paper-slot-' + slot.id + ' item-icon-' + item.id + '" type="button" data-action="paper-cycle" data-hero="' + hero.id + '" data-slot="' + slot.id + '" aria-label="更換' + slot.label + '">' +
      '<i class="slot-mark slot-mark-' + slot.id + '" aria-hidden="true"></i><span>' + slot.label + '</span><b>' + item.name + '</b><small>' + item.bonus + (owned ? "" : " · 未擁有") + '</small><em>點擊輪換已擁有裝備</em></button>';
  }).join("");
  return '<section class="paper-doll-panel">' +
    '<div class="paper-doll-heading"><div><span class="eyebrow">外觀配置</span><h3>紙娃娃</h3></div><span class="paper-doll-hint">點裝備槽切換外觀</span></div>' +
    '<div class="paper-doll-board"><div class="paper-doll-stage">' + avatarHtml(hero, true) + '<span class="paper-doll-rune">' + hero.role + '</span></div><div class="paper-slot-grid">' + slots + '</div></div>' +
    '<p class="paper-doll-note">裝備會立刻套用到戰場、編隊與武將卡。<strong>當前加成：' + equipmentBonusLabel(hero.id) + '</strong></p>' +
    '</section>';
}

function renderHeroDetail(heroId, previewMax = false) {
  const hero = heroById(heroId);
  if (!hero) return;
  runtime.selectedHero = heroId;
  const unlocked = isUnlocked(hero);

  const level = previewMax ? 100 : (save.heroLevels[heroId] || 1);
  const equipment = heroEquipmentStats(heroId);
  const cost = 70 + level * 42;
  const inFormation = save.formation.includes(heroId);
  const refineLevel = Number(save.equipmentRefine?.[heroId] || 0);
  const refineCost = 1 + refineLevel * 2;
  const progression = heroProgression(heroId);
  const growth = previewMax ? 2.2 : heroGrowthMultiplier(heroId);
  const starCost = heroStarCost(heroId);
  const breakthroughCost = heroBreakthroughCost(heroId);
  const skillLevel = previewMax ? 10 : heroSkillLevel(heroId);
  const skillCost = heroSkillCost(heroId);
  const synergy = equipmentSynergyTier(heroId);
  const power = Math.round(((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp + (hero.def + equipment.def) * 12) * (1 + level * 0.13) * growth);

  const headerNotice = !unlocked
    ? '<div class="active-bonds-strip" style="margin-bottom:8px;padding:6px 10px;background:rgba(180,72,50,0.18);border:1px solid rgba(180,72,50,0.4);border-radius:4px;font-size:12px;"><strong>相遇線索：</strong>通關第 ' + hero.unlock + ' 關後加入軍府。以下為滿級滿星圖鑑預覽。</div>'
    : '';

  const synergyTag = synergy.tier > 0
    ? '<span class="level-tag" style="background:linear-gradient(135deg,#c69234,#f0d376);color:#2b1900;margin-left:6px;">' + synergy.name + '</span>'
    : '';

  const relatedBonds = BONDS.filter((bond) => bond.heroes.includes(heroId));
  const heroBondsHtml = relatedBonds.length
    ? '<p class="section-caption">名將緣分</p><div class="collection-list" style="margin-bottom:10px;">' + relatedBonds.map((bond) => {
        const active = activeBonds().some((b) => b.id === bond.id);
        const members = bond.heroes.map((hid) => {
          const h = heroById(hid);
          const inTeam = save.formation.includes(hid);
          return '<span style="color:' + (inTeam ? 'var(--gold,#d7b84f)' : '#888') + ';margin-right:4px;">' + (h?.name || hid) + (inTeam ? '✓' : '') + '</span>';
        }).join("");
        return '<article class="collection-card ' + (active ? 'active' : '') + '" style="padding:6px 10px;"><div><strong>' + bond.name + '</strong><small>' + bond.desc + '</small><div style="font-size:11px;margin-top:2px;">陣容：' + members + '</div></div><em style="font-size:11px;color:' + (active ? 'var(--gold,#d7b84f)' : '#666') + ';">' + (active ? '已啟動' : '未成陣') + '</em></article>';
      }).join("") + '</div>'
    : '';

  const bio = (typeof HERO_BIOGRAPHIES === "object" && HERO_BIOGRAPHIES[heroId]) || { courtesy: "名將", origin: "三國州郡", summary: hero.name + "，三國之世赫赫有名之將，隨主公征戰四方，立下汗馬功勞。", deeds: "身先士卒 · 屢立戰功" };
  const bioHtml = '<p class="section-caption">名將生平列傳</p>' +
    '<div class="hero-skill-card" style="border-color:rgba(215,184,79,0.3);background:linear-gradient(135deg,#1f1a14,#282017);margin-bottom:10px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(215,184,79,0.2);padding-bottom:4px;margin-bottom:6px;">' +
        '<strong style="color:var(--gold,#d7b84f);">' + hero.name + ' · ' + bio.courtesy + '</strong>' +
        '<span style="font-size:11px;opacity:0.75;">籍貫：' + bio.origin + '</span>' +
      '</div>' +
      '<p style="margin:0 0 6px 0;line-height:1.5;font-size:12px;color:#e8ded1;">' + bio.summary + '</p>' +
      '<div style="font-size:11px;color:#c7aa68;border-top:1px dashed rgba(215,184,79,0.15);padding-top:4px;"><b>功績典故</b> · ' + bio.deeds + '</div>' +
    '</div>';

  const sig = typeof heroSignatureResonance === "function" ? heroSignatureResonance(heroId) : null;
  const sigHtml = sig
    ? '<p class="section-caption">專屬神兵真名共鳴</p>' +
      '<div class="hero-skill-card" style="border-color:' + (sig.active ? 'rgba(215,184,79,0.6)' : 'rgba(100,100,100,0.3)') + ';background:' + (sig.active ? 'linear-gradient(135deg,#261c12,#3a2c16)' : '#1a1a1a') + ';margin-bottom:10px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:4px;">' +
          '<strong style="color:' + (sig.active ? 'var(--gold,#d7b84f)' : '#888') + ';">' + sig.name + '</strong>' +
          '<span class="level-tag" style="background:' + (sig.active ? 'linear-gradient(135deg,#c69234,#f0d376);color:#2b1900' : '#444;color:#999') + ';">' + (sig.active ? '神兵真名已啟動' : '未裝備專屬神兵') + '</span>' +
        '</div>' +
        '<p style="margin:4px 0 0 0;font-size:12px;line-height:1.4;color:' + (sig.active ? '#fff2b3' : '#777') + ';">' + sig.desc + '</p>' +
      '</div>'
    : '';

  setPanel("武將詳情",
    headerNotice +
    '<section class="detail-hero">' +
      avatarHtml(hero, true) +
      '<h3>' + hero.name + synergyTag + '</h3>' +
      '<span class="hero-role">' + hero.role + ' · ' + hero.title + '</span>' +
      '<p class="hero-power">戰力 <strong>' + formatNumber(power) + '</strong> ' + (previewMax ? '<small style="color:var(--gold,#d7b84f)">(滿級預覽)</small>' : '') + '</p>' +
      '<p class="hero-progression">星級 ' + (previewMax ? '5 / 5 (極)' : progression.stars + ' / 5') + ' · 突破 ' + (previewMax ? '3 / 3' : progression.breakthrough + ' / 3') + ' · 精煉共鳴: ' + synergy.name + '</p>' +
      '<div class="stat-list">' +
        '<span>武力 <b>' + Math.round(hero.atk + level * 3.2 + equipment.atk) + '</b></span>' +
        '<span>兵力 <b>' + Math.round(hero.hp + level * 23 + equipment.hp) + '</b></span>' +
        '<span>統率 <b>' + Math.round(hero.def + level * .8 + equipment.def) + '</b></span>' +
        '<span>速度 <b>' + Math.round(hero.speed + equipment.speed) + '</b></span>' +
      '</div>' +
    '</section>' +
    '<p class="section-caption">戰法與被動</p>' +
    '<div class="hero-skill-card"><div><strong>戰法 · ' + hero.skill + ' Lv.' + skillLevel + '</strong><span>冷卻 ' + Number(hero.skillCooldown || 5).toFixed(1) + ' 秒</span></div><p><b>效果</b> · ' + (HERO_SKILL_META[hero.id]?.effect || "根據兵種發揮") + '</p><p><b>範圍</b> · ' + (HERO_SKILL_META[hero.id]?.area || hero.role) + '</p><p><b>被動</b> · ' + (hero.passive || "尚未記載") + '</p></div>' +
    sigHtml +
    heroBondsHtml +
    bioHtml +
    (unlocked ? paperDollHtml(hero) : '<div class="record-item" style="margin-top:10px;">' + synergy.desc + '</div>') +
    '<div class="action-row">' +
      (unlocked ?
        '<button class="stone-button" type="button" data-action="formation-toggle" data-hero="' + heroId + '">' + (inFormation ? "撤下陣容" : "加入陣容") + '</button>' +
        '<button class="seal-button" type="button" data-action="hero-level" data-hero="' + heroId + '"' + (save.gold < cost ? " disabled" : "") + '>升至 Lv.' + (level + 1) + '<br><small>' + cost + ' 銅錢</small></button>' +
        '<button class="stone-button compact-button" type="button" data-action="equipment-refine" data-hero="' + heroId + '"' + (save.jade < refineCost ? " disabled" : "") + '>精煉 +' + refineLevel + '<br><small>' + refineCost + ' 玉璧</small></button>' +
        '<button class="stone-button compact-button" type="button" data-action="hero-star" data-hero="' + heroId + '"' + (!starCost || save.shards < starCost.shards || save.gold < starCost.gold ? " disabled" : "") + '>升星 +' + (progression.stars + 1) + '<br><small>' + (starCost ? starCost.shards + " 碎片" : "已滿星") + '</small></button>' +
        '<button class="stone-button compact-button" type="button" data-action="hero-breakthrough" data-hero="' + heroId + '"' + (!breakthroughCost || save.shards < breakthroughCost.shards || save.jade < breakthroughCost.jade ? " disabled" : "") + '>突破 +' + (progression.breakthrough + 1) + '<br><small>' + (breakthroughCost ? breakthroughCost.shards + " 碎片 + " + breakthroughCost.jade + " 玉璧" : "需 3 星") + '</small></button>' +
        '<button class="stone-button compact-button" type="button" data-action="hero-skill" data-hero="' + heroId + '"' + (!skillCost || save.gold < skillCost.gold || save.food < skillCost.food ? " disabled" : "") + '>戰法 +' + (skillLevel + 1) + '<br><small>' + (skillCost ? skillCost.gold + " 銅錢 + " + skillCost.food + " 糧草" : "已滿級") + '</small></button>'
        : '<button class="seal-button wide-button" type="button" data-action="campaign-select" data-stage="' + hero.unlock + '">前往征戰第 ' + hero.unlock + ' 關相遇</button>'
      ) +
    '</div>',
    true
  );
}

function renderFormation() {
  const picked = runtime.formationPick;
  const slots = Array.from({ length: 9 }, (_, slot) => {
    const heroId = save.formation.find((id) => save.positions[id] === slot);
    const hero = heroId ? heroById(heroId) : null;
    const selected = picked === slot;
    const row = Math.floor(slot / 3);
    const rowTag = row === 0 ? "前·堅壁" : row === 1 ? "中·突擊" : "後·策應";
    return '<button class="formation-slot' + (hero ? " filled" : "") + (selected ? " selected" : "") + '" type="button" data-action="formation-slot-swap" data-slot="' + slot + '"' + (hero ? ' data-hero="' + hero.id + '"' : "") + '>' +
      '<span class="slot-pos-tag" style="position:absolute;top:2px;left:4px;font-size:10px;opacity:0.75;">' + rowTag + '</span>' +
      (hero ? avatarHtml(hero) + "<b>" + hero.name + "</b>" : "<small style='margin-top:10px;'>空位</small>") +
    '</button>';
  }).join("");
  const power = save.formation.reduce((sum, id) => {
    const hero = heroById(id);
    const equipment = heroEquipmentStats(id);
    return sum + Math.round(((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp) * (1 + save.heroLevels[id] * .13));
  }, 0);
  const bonds = activeBonds();
  const bondsHtml = bonds.length
    ? '<div class="active-bonds-strip" style="margin-top:10px;padding:6px 10px;background:rgba(215,184,79,0.12);border:1px solid rgba(215,184,79,0.3);border-radius:4px;font-size:12px;"><strong>啟動羈絆：</strong>' + bonds.map((b) => '<span style="margin-right:8px;color:var(--gold,#d7b84f);">[' + b.name + '] ' + b.desc + '</span>').join("") + '</div>'
    : '<div class="active-bonds-strip" style="margin-top:10px;padding:4px 8px;font-size:11px;opacity:0.75;">湊齊桃園三結義、五虎將、臥龍鳳雛等可啟動額外羈絆。</div>';

  const masteryCards = Object.entries(TROOP_CLASSES).map(([role, info]) => {
    const lvl = troopMasteryLevel(role);
    const cost = troopMasteryCost(role);
    const bonus = troopMasteryBonus(role);
    let bonusText = "";
    if (role === "步兵") bonusText = "生命+" + Math.round(bonus.hp * 100) + "% 防禦+" + Math.round(bonus.def * 100) + "%";
    else if (role === "騎兵") bonusText = "攻擊+" + Math.round(bonus.atk * 100) + "% 速度+" + Math.round(bonus.speed * 100) + "%";
    else if (role === "弓兵") bonusText = "攻擊+" + Math.round(bonus.atk * 100) + "% 射程+" + Math.round(bonus.range);
    else if (role === "謀士") bonusText = "攻擊+" + Math.round(bonus.atk * 100) + "%";

    const canUpgrade = cost && save.gold >= cost.gold && save.food >= cost.food;
    return '<article class="collection-card" style="padding:8px 10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">' +
      '<div>' +
        '<strong style="color:' + info.color + ';">' + info.icon + ' ' + role + '精研 Lv.' + lvl + (lvl >= 10 ? ' (極)' : '') + '</strong>' +
        '<small style="display:block;margin-top:2px;">' + info.desc + '</small>' +
        (lvl > 0 ? '<div style="font-size:11px;color:var(--gold,#d7b84f);margin-top:2px;">加成：' + bonusText + '</div>' : '') +
      '</div>' +
      '<div>' +
        (cost ?
          '<button class="seal-button compact-button" type="button" data-action="troop-mastery-upgrade" data-role="' + role + '"' + (canUpgrade ? '' : ' disabled') + '>精研 Lv.' + (lvl + 1) + '<br><small>' + cost.gold + ' 錢 ' + cost.food + ' 糧</small></button>' :
          '<span class="level-tag" style="background:#555;color:#aaa;">已精研大成</span>'
        ) +
      '</div>' +
    '</article>';
  }).join("");

  const troopSectionHtml = '<p class="section-caption" style="margin-top:14px;">兵種相剋與兵法精研</p>' +
    '<div class="collection-list" style="margin-bottom:10px;">' + masteryCards + '</div>';

  setPanel("出戰編隊",
    '<div class="formation-layout">' +
      '<div class="formation-board"><div class="slot-grid">' + slots + '</div></div>' +
      '<aside class="formation-summary">' +
        '<h3>義勇軍陣</h3>' +
        '<p>出戰 <strong>' + save.formation.length + ' / 5</strong></p>' +
        '<p>總戰力<br><strong>' + formatNumber(power) + '</strong></p>' +
        '<p style="font-size:11px;line-height:1.4;">前排：生命+10% 防禦+12%<br>中排：攻擊+8% 暴擊<br>後排：攻速+8% 射程+18</p>' +
        '<button class="seal-button" type="button" data-action="formation-save">套用編隊</button>' +
      '</aside>' +
    '</div>' +
    bondsHtml +
    troopSectionHtml +
    '<p class="section-caption">點選武將加入或撤下</p>' +
    '<div class="hero-grid">' + HEROES.filter(isUnlocked).map((hero) => heroCardHtml(hero, "formation-toggle")).join("") + '</div>');
}

function upgradeTroopMastery(role) {
  ensureCycleState();
  const cost = troopMasteryCost(role);
  if (!cost || save.gold < cost.gold || save.food < cost.food) return;
  save.gold -= cost.gold;
  save.food -= cost.food;
  save.troopMastery[role] = troopMasteryLevel(role) + 1;
  resetAllies();
  persist();
  updateHud();
  renderFormation();
  toast(role + "兵法已精研至 Lv." + save.troopMastery[role] + "！");
  beep(520, 0.08, "triangle", 0.04);
}

function renderTactics() {
  const activeTactic = save.equippedTactic || "snake";
  const tacticCards = TACTICS.map((tactic) => {
    const level = save.tactics[tactic.id] || 1;
    const cost = tactic.cost * level;
    const isEquipped = tactic.id === activeTactic;
    const rawBonus = tactic.base + (level - 1) * 0.025;
    return '<article class="tactic-card' + (isEquipped ? " active-equipped" : "") + '">' +
      '<div class="tactic-sigil"><span>' + tactic.sigil + '</span></div>' +
      '<h3>' + tactic.name + (isEquipped ? ' <small class="level-tag">出戰中</small>' : '') + '</h3>' +
      '<span class="level-tag">Lv.' + level + '</span>' +
      '<p>' + tactic.desc + '<br>滿級加成：' + Math.round(rawBonus * 100) + '%' + (isEquipped ? ' · <strong style="color:var(--gold,#d7b84f)">生效中</strong>' : ' · 未啟用') + '</p>' +
      '<div class="action-row" style="display:flex;gap:6px;margin-top:8px;">' +
        '<button class="' + (isEquipped ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="tactic-equip" data-tactic="' + tactic.id + '"' + (isEquipped ? " disabled" : "") + '>' + (isEquipped ? "已配備" : "出戰") + '</button>' +
        '<button class="stone-button panel-action" type="button" data-action="tactic-level" data-tactic="' + tactic.id + '"' + (save.food < cost ? " disabled" : "") + '>強化 ' + cost + ' 糧</button>' +
      '</div>' +
    '</article>';
  }).join("");
  setPanel("兵法戰策",
    '<div class="panel-tabs"><button class="active" type="button">軍陣戰法</button><span class="tab-note">每場攜帶一個生效</span></div>' +
    '<p class="section-caption">選擇符合當前關卡或對手特點的戰法出戰，提升隊伍剋制優勢。</p>' +
    '<div class="tactic-list">' + tacticCards + '</div>');
}

function toggleFormation(heroId) {
  const hero = heroById(heroId);
  if (!hero || !isUnlocked(hero)) return;
  const index = save.formation.indexOf(heroId);
  if (index >= 0) {
    if (save.formation.length <= 1) return toast("陣中至少需留一名大將");
    save.formation.splice(index, 1);
    delete save.positions[heroId];
    toast("已撤下 " + hero.name);
  } else {
    if (save.formation.length >= 5) return toast("軍陣已滿 5 名武將");
    save.formation.push(heroId);
    const occupied = new Set(Object.values(save.positions));
    for (let slot = 0; slot < 9; slot += 1) {
      if (!occupied.has(slot)) {
        save.positions[heroId] = slot;
        break;
      }
    }
    toast(hero.name + " 已加入出戰名單");
  }
  resetAllies();
  persist();
  updateHud();
}

function swapFormationSlots(slot) {
  const targetSlot = Number(slot);
  if (runtime.formationPick === null || runtime.formationPick === undefined) {
    runtime.formationPick = targetSlot;
    renderFormation();
    return;
  }
  const sourceSlot = runtime.formationPick;
  runtime.formationPick = null;
  if (sourceSlot === targetSlot) {
    renderFormation();
    return;
  }
  const sourceHeroId = save.formation.find((id) => save.positions[id] === sourceSlot);
  const targetHeroId = save.formation.find((id) => save.positions[id] === targetSlot);
  if (sourceHeroId) save.positions[sourceHeroId] = targetSlot;
  if (targetHeroId) save.positions[targetHeroId] = sourceSlot;
  resetAllies();
  persist();
  renderFormation();
  toast("陣型站位已調整");
}

function refineHeroEquipment(heroId) {
  const hero = heroById(heroId);
  if (!hero || !isUnlocked(hero)) return;
  const level = Number(save.equipmentRefine?.[heroId] || 0);
  const cost = 1 + level * 2;
  if (save.jade < cost) return toast("玉璧不足");
  save.jade -= cost;
  save.equipmentRefine[heroId] = level + 1;
  resetAllies();
  persist();
  updateHud();
  window.TaoyuanAudio?.sfx?.("reward");
  toast(hero.name + " 裝備精煉至 +" + save.equipmentRefine[heroId]);
  renderHeroDetail(heroId);
}

function upgradeHeroStar(heroId) {
  const hero = heroById(heroId);
  const progress = hero ? heroProgression(heroId) : null;
  const cost = hero ? heroStarCost(heroId) : null;
  if (!hero || !isUnlocked(hero) || !cost) return toast("名將已滿星");
  if (save.shards < cost.shards || save.gold < cost.gold) return toast("碎片或銅錢不足");
  save.shards -= cost.shards;
  save.gold -= cost.gold;
  progress.stars += 1;
  resetAllies();
  persist();
  updateHud();
  window.TaoyuanAudio?.sfx?.("confirm");
  toast(hero.name + " 升星至 " + progress.stars + " 星");
  renderHeroDetail(heroId);
}

function upgradeHeroSkill(heroId) {
  const hero = heroById(heroId);
  const cost = hero ? heroSkillCost(heroId) : null;
  if (!hero || !isUnlocked(hero) || !cost) return toast("戰法已滿級");
  if (save.gold < cost.gold || save.food < cost.food) return toast("銅錢或糧草不足");
  save.gold -= cost.gold;
  save.food -= cost.food;
  save.skillLevels[heroId] += 1;
  recordTaskProgress("daily-upgrade");
  resetAllies();
  persist();
  updateHud();
  window.TaoyuanAudio?.sfx?.("confirm");
  toast(hero.name + " 戰法升至 Lv." + save.skillLevels[heroId]);
  renderHeroDetail(heroId);
}

function breakthroughHero(heroId) {
  return upgradeHeroBreakthrough(heroId);
}

function upgradeHeroBreakthrough(heroId) {
  const hero = heroById(heroId);
  const progress = hero ? heroProgression(heroId) : null;
  const cost = hero ? heroBreakthroughCost(heroId) : null;
  if (!hero || !isUnlocked(hero) || !cost) return toast("名將需先達 3 星方可突破");
  if (save.shards < cost.shards || save.jade < cost.jade) return toast("突破碎片或玉璧不足");
  save.shards -= cost.shards;
  save.jade -= cost.jade;
  progress.breakthrough += 1;
  resetAllies();
  persist();
  updateHud();
  window.TaoyuanAudio?.sfx?.("reward");
  toast(hero.name + " 突破至 +" + progress.breakthrough);
  renderHeroDetail(heroId);
}

function cycleOwnedEquipment(slotId, currentId) {
  const slot = PAPER_DOLL_SLOTS.find((item) => item.id === slotId);
  if (!slot) return currentId;
  const ownedChoices = slot.choices.filter((choice) => isEquipmentOwned(slotId, choice.id));
  if (!ownedChoices.length) return slot.choices[0]?.id || currentId;
  const index = ownedChoices.findIndex((choice) => choice.id === currentId);
  const nextChoice = ownedChoices[(index + 1) % ownedChoices.length];
  return nextChoice?.id || ownedChoices[0].id;
}

function cycleHeroPaperDoll(heroId, slotId) {
  const hero = heroById(heroId);
  if (!hero || !isUnlocked(hero)) return;
  const slot = PAPER_DOLL_SLOTS.find((item) => item.id === slotId);
  if (!slot) return;
  const loadout = heroLoadout(heroId);
  const nextId = cycleOwnedEquipment(slotId, loadout[slotId]);
  loadout[slotId] = nextId;
  resetAllies();
  persist();
  renderHeroDetail(heroId);
  toast(hero.name + " 換裝：" + (slot.choices.find((item) => item.id === nextId)?.name || slot.label));
}

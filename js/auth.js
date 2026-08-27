(function installTaoyuanAuth() {
  "use strict";
  const AUTH_KEY = "taoyuan-auth-v1";
  const LEGACY_SAVE_KEY = "taoyuan-qunying-v2";
  const ACCOUNT_SAVE_PREFIX = "taoyuan-save-";
  const state = readState();
  let mode = "login";

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
      if (stored && Array.isArray(stored.accounts)) return { version: 1, currentUserId: stored.currentUserId || null, accounts: stored.accounts };
    } catch { /* fall through to a clean local profile */ }
    return { version: 1, currentUserId: null, accounts: [] };
  }

  function persistState() {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  }

  function normalizeUsername(value) {
    return String(value || "").trim().replace(/\s+/g, " ").slice(0, 16);
  }

  function hashPassword(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function activeAccount() {
    return state.accounts.find((account) => account.id === state.currentUserId) || null;
  }

  function accountSaveKey(id) {
    return ACCOUNT_SAVE_PREFIX + id;
  }

  function migrateLegacySave(id) {
    const targetKey = accountSaveKey(id);
    if (localStorage.getItem(targetKey)) return;
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacy) localStorage.setItem(targetKey, legacy);
  }

  function selectAccount(id) {
    state.currentUserId = id;
    migrateLegacySave(id);
    persistState();
  }

  function setMessage(message, type = "error") {
    const element = document.getElementById("authMessage");
    if (!element) return;
    element.textContent = message;
    element.className = "auth-message " + type;
  }

  function setMode(nextMode) {
    mode = ["login", "register", "reset"].includes(nextMode) ? nextMode : "login";
    document.querySelectorAll("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
    const confirmWrap = document.getElementById("authPasswordConfirmWrap");
    const submit = document.getElementById("authSubmit");
    const guest = document.getElementById("authGuest");
    const title = document.getElementById("authModeTitle");
    if (confirmWrap) confirmWrap.hidden = mode === "login";
    if (submit) submit.textContent = mode === "login" ? "進入軍府" : mode === "register" ? "建立本機帳號" : "更新本機密碼";
    if (guest) guest.hidden = mode !== "login";
    if (title) title.textContent = mode === "login" ? "登入軍府" : mode === "register" ? "建立新軍府" : "重設本機密碼";
    setMessage("");
  }

  function open(options = {}) {
    const screen = document.getElementById("authScreen");
    if (!screen) return;
    const close = document.getElementById("authClose");
    if (close) close.hidden = !activeAccount();
    screen.hidden = false;
    setMode(options.mode || "login");
    document.getElementById("authUsername")?.focus();
  }

  function close() {
    if (!activeAccount()) return;
    const screen = document.getElementById("authScreen");
    if (screen) screen.hidden = true;
  }

  function createAccount(username, password, guest = false) {
    const id = (guest ? "guest-" : "user-") + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    const account = { id, username, passwordHash: hashPassword(password), guest, createdAt: Date.now() };
    state.accounts.push(account);
    selectAccount(id);
    return account;
  }

  function submit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("authUsername");
    const passwordInput = document.getElementById("authPassword");
    const confirmInput = document.getElementById("authPasswordConfirm");
    const username = normalizeUsername(usernameInput?.value);
    const password = String(passwordInput?.value || "");
    const confirm = String(confirmInput?.value || "");
    if (username.length < 2) return setMessage("請輸入 2–16 個字元的軍府名稱");
    if (password.length < 4) return setMessage("本機密碼至少需要 4 個字元");
    if (mode !== "login" && password !== confirm) return setMessage("兩次輸入的密碼不一致");
    const found = state.accounts.find((account) => account.username.toLocaleLowerCase() === username.toLocaleLowerCase());
    if (mode === "login") {
      if (!found || found.passwordHash !== hashPassword(password)) return setMessage("軍府名稱或密碼不正確");
      selectAccount(found.id);
      location.reload();
      return;
    }
    if (mode === "register") {
      if (found) return setMessage("這個軍府名稱已經存在");
      createAccount(username, password);
      location.reload();
      return;
    }
    if (!found) return setMessage("找不到這個本機軍府名稱");
    found.passwordHash = hashPassword(password);
    selectAccount(found.id);
    location.reload();
  }

  function guestLogin() {
    let number = 1;
    let username = "旅人" + String(number).padStart(3, "0");
    while (state.accounts.some((account) => account.username === username)) {
      number += 1;
      username = "旅人" + String(number).padStart(3, "0");
    }
    createAccount(username, "guest-" + Date.now(), true);
    location.reload();
  }

  function logout() {
    state.currentUserId = null;
    persistState();
    location.reload();
  }

  function render() {
    document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.authMode)));
    document.getElementById("authForm")?.addEventListener("submit", submit);
    document.getElementById("authGuest")?.addEventListener("click", guestLogin);
    document.getElementById("authClose")?.addEventListener("click", close);
    const screen = document.getElementById("authScreen");
    if (screen) screen.hidden = Boolean(activeAccount());
    setMode("login");
  }

  const api = {
    getSaveKey: () => activeAccount() ? accountSaveKey(activeAccount().id) : LEGACY_SAVE_KEY,
    getActiveUser: activeAccount,
    isAuthenticated: () => Boolean(activeAccount()),
    open,
    close,
    logout,
    setMode,
    getAccountCount: () => state.accounts.length
  };
  window.TaoyuanAuth = Object.freeze(api);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
}());

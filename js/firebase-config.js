"use strict";

// This file is intentionally safe to commit. Production values are injected by
// `node build.js --release` from TAOYUAN_FIREBASE_* environment variables.
window.TAOYUAN_FIREBASE_CONFIG = Object.freeze({
  apiKey: "REPLACE_WITH_FIREBASE_WEB_API_KEY",
  authDomain: "REPLACE_WITH_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_FIREBASE_WEB_APP_ID",
  measurementId: ""
});

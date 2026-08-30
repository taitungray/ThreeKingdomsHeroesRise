/* Browser interaction guard: the game surface is not a document or an image gallery. */
"use strict";

(function installGameInputGuard() {
  const gameApp = document.getElementById("gameApp");
  if (!gameApp) return;

  const editableSelector = "input, textarea, select, [contenteditable='true']";
  const isInsideGame = (target) => target === gameApp || gameApp.contains(target);
  const isEditable = (target) => Boolean(target && typeof target.closest === "function" && target.closest(editableSelector));

  // Keep the game surface from exposing browser document/image actions.
  document.addEventListener("contextmenu", (event) => {
    if (isInsideGame(event.target)) event.preventDefault();
  }, true);

  // Prevent blue text selection while preserving editable tutorial/account fields.
  document.addEventListener("selectstart", (event) => {
    if (isInsideGame(event.target) && !isEditable(event.target)) event.preventDefault();
  }, true);

  // Prevent native drag-out for images, canvas content and links; game scrolling uses pointer input.
  document.addEventListener("dragstart", (event) => {
    if (isInsideGame(event.target) && !isEditable(event.target)) event.preventDefault();
  }, true);
})();

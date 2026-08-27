(function installTaoyuanAudio() {
  "use strict";
  const state = {
    context: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    musicTimer: 0,
    musicStep: 0,
    unlocked: false,
    sound: true,
    music: true
  };
  const melody = [293.66, 349.23, 392, 440, 392, 349.23, 293.66, 261.63, 293.66, 392, 440, 523.25, 440, 392, 349.23, 293.66];

  function ensureContext() {
    if (state.context) return state.context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      state.context = new AudioContextClass();
      state.master = state.context.createGain();
      state.musicGain = state.context.createGain();
      state.sfxGain = state.context.createGain();
      state.master.gain.value = 0.58;
      state.musicGain.gain.value = 0.17;
      state.sfxGain.gain.value = 0.62;
      state.musicGain.connect(state.master);
      state.sfxGain.connect(state.master);
      state.master.connect(state.context.destination);
    } catch {
      state.context = null;
    }
    return state.context;
  }

  function tone(frequency = 280, duration = 0.045, type = "square", gain = 0.025, channel = "sfx", delay = 0) {
    if (channel === "sfx" && !state.sound) return;
    if (channel === "music" && !state.music) return;
    const context = ensureContext();
    if (!context) return;
    try {
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      const startAt = context.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      volume.gain.setValueAtTime(Math.max(0.0001, gain), startAt);
      volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(volume).connect(channel === "music" ? state.musicGain : state.sfxGain);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.02);
    } catch { /* optional audio in restricted WebViews */ }
  }

  function playMusicStep() {
    if (!state.music || !state.unlocked) return;
    const index = state.musicStep % melody.length;
    state.musicStep += 1;
    tone(melody[index], .36, "triangle", .045, "music");
    if (index % 4 === 0) tone(melody[index] / 2, .5, "sine", .025, "music", .02);
  }

  function startMusic() {
    if (!state.music || state.musicTimer || !state.unlocked) return;
    if (!ensureContext()) return;
    state.musicTimer = window.setInterval(playMusicStep, 520);
    playMusicStep();
  }

  function stopMusic() {
    if (state.musicTimer) window.clearInterval(state.musicTimer);
    state.musicTimer = 0;
  }

  function unlock() {
    const context = ensureContext();
    state.unlocked = true;
    if (context?.resume) context.resume().catch(() => {});
    startMusic();
  }

  function configure(options = {}) {
    if (typeof options.sound === "boolean") state.sound = options.sound;
    if (typeof options.music === "boolean") state.music = options.music;
    if (!state.music) stopMusic();
    else if (state.unlocked) startMusic();
  }

  function sfx(kind) {
    const patterns = {
      click: [[240, .035, "square", .018]],
      confirm: [[440, .07, "triangle", .025], [660, .11, "triangle", .02, 0.06]],
      cancel: [[180, .08, "square", .02], [130, .11, "square", .016, 0.07]],
      hit: [[120, .055, "sawtooth", .026]],
      skill: [[260, .1, "triangle", .028], [520, .14, "triangle", .025, 0.07], [780, .18, "sine", .018, 0.14]],
      reward: [[392, .12, "sine", .028], [523.25, .14, "sine", .024, 0.1], [783.99, .22, "triangle", .02, 0.2]],
      boss: [[95, .22, "sawtooth", .04], [70, .28, "square", .028, 0.12]]
    };
    (patterns[kind] || patterns.click).forEach(([frequency, duration, type, gain, delay]) => tone(frequency, duration, type, gain, "sfx", delay || 0));
  }

  window.TaoyuanAudio = Object.freeze({ configure, unlock, startMusic, stopMusic, tone, sfx });
  document.addEventListener("pointerdown", unlock, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMusic();
    else if (state.music && state.unlocked) startMusic();
  });
}());

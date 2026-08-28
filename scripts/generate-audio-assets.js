"use strict";

const fs = require("fs");
const path = require("path");

// 採用 22050 Hz 輕量取樣率，長度 48 秒無縫循環熱血戰鬥行軍曲 (120 BPM)
const SAMPLE_RATE = 22050;
const AUDIO_DIR = path.join(__dirname, "..", "assets", "audio");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function createWavBuffer(samples, sampleRate = SAMPLE_RATE, channels = 1) {
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt Subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);

  // data Subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intSample), 44 + i * 2);
  }

  return buffer;
}

function applyLowPass(input, cutoffHz) {
  const output = new Float32Array(input.length);
  const rc = 1.0 / (2.0 * Math.PI * cutoffHz);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  let last = 0;
  for (let i = 0; i < input.length; i++) {
    last = last + alpha * (input[i] - last);
    output[i] = last;
  }
  return output;
}

/* =========================================================================
   戰鬥專屬樂器合成器
   ========================================================================= */

// 1. 強力行軍重戰鼓 (Marching Bass Drum)
function synthKick(gain = 0.6) {
  const dur = 0.35;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const f = 110 - progress * 70; // 110Hz -> 40Hz punch
    const env = Math.exp(-progress * 9);
    buffer[i] = Math.sin(2 * Math.PI * f * t) * gain * env;
  }
  return buffer;
}

// 2. 軍陣小軍鼓/拍子鼓 (Snare / Taiko Slap)
function synthSnare(gain = 0.38) {
  const dur = 0.22;
  const numSamples = Math.floor(SAMPLE_RATE * dur);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const t = i / SAMPLE_RATE;
    const tone = Math.sin(2 * Math.PI * 180 * t) * 0.4;
    const snap = (Math.random() * 2 - 1) * 0.6;
    const env = Math.exp(-progress * 14);
    buffer[i] = (tone + snap) * gain * env;
  }
  return applyLowPass(buffer, 2400);
}

// 3. 短促有力的軍陣低音斷奏 (Battle Bass Staccato)
function synthBassStaccato(freq, duration = 0.22, gain = 0.42) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    // 粗獷的鋸齒波低音
    const s = Math.sin(2 * Math.PI * freq * t) +
              0.5 * Math.sin(2 * Math.PI * freq * 2 * t) +
              0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
    const env = Math.exp(-progress * 6.5);
    buffer[i] = s * gain * env;
  }
  return applyLowPass(buffer, 850);
}

// 4. 激昂出征號角/戰陣五音古箏 (Heroic Battle Lead)
function synthBattleLead(freq, duration = 0.4, gain = 0.38) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const s = Math.sin(2 * Math.PI * freq * t) +
              0.4 * Math.sin(2 * Math.PI * freq * 2 * t) +
              0.2 * Math.sin(2 * Math.PI * freq * 3 * t);
    const env = Math.exp(-progress * 3.2);
    const att = Math.min(1, i / (SAMPLE_RATE * 0.005));
    buffer[i] = s * gain * env * att;
  }
  return applyLowPass(buffer, 2200);
}

// 5. 戰役長音和弦鋪底 (Battle Strings Pad)
function synthBattlePad(freqs, duration, gain = 0.25) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const attack = Math.floor(SAMPLE_RATE * 0.2);
  const release = Math.floor(SAMPLE_RATE * 0.4);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (let f = 0; f < freqs.length; f++) {
      s += Math.sin(2 * Math.PI * freqs[f] * t);
    }
    let env = 1.0;
    if (i < attack) env = i / attack;
    else if (i > numSamples - release) env = (numSamples - i) / release;
    buffer[i] = s * (gain / freqs.length) * env;
  }
  return applyLowPass(buffer, 900);
}

function mixTrack(dest, src, startOffsetSample, volume = 1.0) {
  for (let i = 0; i < src.length; i++) {
    const idx = startOffsetSample + i;
    if (idx < dest.length) dest[idx] += src[i] * volume;
  }
}

/* =========================================================================
   熱血三國行軍戰鬥曲生成 (120 BPM, 48 秒無縫循環)
   ========================================================================= */

function generateBgm() {
  console.log("Generating 120-BPM Heroic Battle March BGM: assets/audio/bgm-main.wav...");
  const duration = 48.0; // 48 秒循環，節奏緊湊
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const track = new Float32Array(totalSamples);

  const N = {
    D2: 73.42, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81,
    D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63,
    D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25,
    D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
  };

  // 120 BPM -> 每拍 0.5 秒，半拍 0.25 秒
  const beat = 0.5;

  // 1. 強勁行軍戰鬥鼓點 (Kick + Snare 120 BPM Drive)
  for (let t = 0; t < duration; t += beat) {
    const beatIndex = Math.round(t / beat);
    // 拍 1, 3 擊重鼓 (Kick)
    if (beatIndex % 2 === 0) {
      const kick = synthKick(0.55);
      mixTrack(track, kick, Math.floor(t * SAMPLE_RATE));
    }
    // 拍 2, 4 擊軍鼓 (Snare)
    if (beatIndex % 2 === 1) {
      const snare = synthSnare(0.4);
      mixTrack(track, snare, Math.floor(t * SAMPLE_RATE));
    }
    // 16 分音符小碎鼓加強前進感
    if (beatIndex % 4 === 3) {
      const ghost = synthSnare(0.18);
      mixTrack(track, ghost, Math.floor((t + 0.25) * SAMPLE_RATE));
    }
  }

  // 2. 緊湊軍陣低音線 (Battle Bass Staccato Groove)
  // 和弦循環：Dm (4s) -> Bb (4s) -> C (4s) -> Dm (4s)
  for (let t = 0; t < duration; t += 0.25) {
    const bar = Math.floor(t / 4.0) % 4;
    const root = bar === 0 ? N.D2 : bar === 1 ? N.Bb2 : bar === 2 ? N.C3 : N.D2;
    const fifth = bar === 0 ? N.A2 : bar === 1 ? N.F2 : bar === 2 ? N.G2 : N.A2;
    const beatInBar = (t % 1.0);
    const note = (beatInBar < 0.25 || beatInBar >= 0.75) ? root : fifth;

    const bass = synthBassStaccato(note, 0.2, 0.36);
    mixTrack(track, bass, Math.floor(t * SAMPLE_RATE));
  }

  // 3. 戰役氛圍和弦鋪底 (Strings Pad)
  for (let t = 0; t < duration; t += 4.0) {
    const bar = Math.floor(t / 4.0) % 4;
    const chord = bar === 0 ? [N.D3, N.F3, N.A3]
                : bar === 1 ? [N.Bb2, N.D3, N.F3]
                : bar === 2 ? [N.C3, N.E3, N.G3]
                : [N.D3, N.F3, N.A3];
    const pad = synthBattlePad(chord, 4.1, 0.3);
    mixTrack(track, pad, Math.floor(t * SAMPLE_RATE));
  }

  // 4. 激昂熱血名將主旋律 (Heroic March Lead 48s)
  const battleMelody = [
    // 段落 1 (0~16s) 義勇出征
    { note: N.D4, t: 0.0, d: 0.4 }, { note: N.D4, t: 0.5, d: 0.4 }, { note: N.F4, t: 1.0, d: 0.4 }, { note: N.G4, t: 1.5, d: 0.4 },
    { note: N.A4, t: 2.0, d: 0.8 }, { note: N.F4, t: 3.0, d: 0.4 }, { note: N.G4, t: 3.5, d: 0.4 },
    { note: N.A4, t: 4.0, d: 0.5 }, { note: N.Bb4, t: 4.5, d: 0.4 }, { note: N.A4, t: 5.0, d: 0.5 }, { note: N.F4, t: 5.5, d: 0.4 },
    { note: N.G4, t: 6.0, d: 1.2 }, { note: N.D4, t: 7.5, d: 0.4 },

    { note: N.D4, t: 8.0, d: 0.4 }, { note: N.F4, t: 8.5, d: 0.4 }, { note: N.A4, t: 9.0, d: 0.5 }, { note: N.D5, t: 9.5, d: 0.4 },
    { note: N.C5, t: 10.0, d: 0.8 }, { note: N.A4, t: 11.0, d: 0.5 }, { note: N.F4, t: 11.5, d: 0.4 },
    { note: N.G4, t: 12.0, d: 0.8 }, { note: N.E4, t: 13.0, d: 0.8 }, { note: N.D4, t: 14.0, d: 1.8 },

    // 段落 2 (16~32s) 兵臨城下
    { note: N.D5, t: 16.0, d: 0.5 }, { note: N.D5, t: 16.5, d: 0.4 }, { note: N.C5, t: 17.0, d: 0.5 }, { note: N.A4, t: 17.5, d: 0.4 },
    { note: N.Bb4, t: 18.0, d: 0.8 }, { note: N.G4, t: 19.0, d: 0.5 }, { note: N.Bb4, t: 19.5, d: 0.4 },
    { note: N.C5, t: 20.0, d: 0.8 }, { note: N.A4, t: 21.0, d: 0.5 }, { note: N.F4, t: 21.5, d: 0.4 },
    { note: N.G4, t: 22.0, d: 1.5 },

    { note: N.A4, t: 24.0, d: 0.4 }, { note: N.C5, t: 24.5, d: 0.4 }, { note: N.D5, t: 25.0, d: 0.8 }, { note: N.F5, t: 26.0, d: 0.8 },
    { note: N.E5, t: 27.0, d: 0.8 }, { note: N.D5, t: 28.0, d: 0.5 }, { note: N.C5, t: 28.5, d: 0.4 }, { note: N.D5, t: 29.0, d: 2.2 },

    // 段落 3 (32~48s) 決戰鏖兵與平滑回歸
    { note: N.F5, t: 32.0, d: 0.5 }, { note: N.E5, t: 32.5, d: 0.4 }, { note: N.D5, t: 33.0, d: 0.5 }, { note: N.C5, t: 33.5, d: 0.4 },
    { note: N.D5, t: 34.0, d: 0.8 }, { note: N.A4, t: 35.0, d: 0.8 },
    { note: N.Bb4, t: 36.0, d: 0.5 }, { note: N.C5, t: 36.5, d: 0.4 }, { note: N.D5, t: 37.0, d: 0.8 }, { note: N.F5, t: 38.0, d: 0.8 },
    { note: N.G5, t: 39.0, d: 1.2 },

    { note: N.F5, t: 41.0, d: 0.4 }, { note: N.E5, t: 41.5, d: 0.4 }, { note: N.D5, t: 42.0, d: 0.8 }, { note: N.C5, t: 43.0, d: 0.5 }, { note: N.A4, t: 43.5, d: 0.4 },
    { note: N.G4, t: 44.0, d: 0.8 }, { note: N.E4, t: 45.0, d: 0.8 }, { note: N.D4, t: 46.0, d: 1.8 }
  ];

  battleMelody.forEach(({ note, t, d }) => {
    const lead = synthBattleLead(note, d, 0.4);
    mixTrack(track, lead, Math.floor(t * SAMPLE_RATE));
  });

  // 5. 無縫淡入淡出 (Cross-fade 0.25s)
  const fadeLen = Math.floor(SAMPLE_RATE * 0.25);
  for (let i = 0; i < fadeLen; i++) {
    const fade = i / fadeLen;
    track[i] *= fade;
    track[totalSamples - 1 - i] *= fade;
  }

  // 6. 正規化
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(track[i]) > peak) peak = Math.abs(track[i]);
  }
  if (peak > 0.85) {
    const factor = 0.85 / peak;
    for (let i = 0; i < totalSamples; i++) track[i] *= factor;
  }

  const wavBuf = createWavBuffer(track);
  fs.writeFileSync(path.join(AUDIO_DIR, "bgm-main.wav"), wavBuf);
  console.log("-> bgm-main.wav created (Battle March " + duration + "s, " + (wavBuf.length / 1024).toFixed(1) + " KB)");
}

/* =========================================================================
   打擊與技能音效生成
   ========================================================================= */

function synthMetallic(freqs, duration = 0.35, gain = 0.45, decaySpeed = 12) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const env = Math.exp(-progress * decaySpeed);
    let sample = 0;
    for (let j = 0; j < freqs.length; j++) {
      sample += Math.sin(2 * Math.PI * freqs[j][0] * t) * freqs[j][1];
    }
    buffer[i] = sample * gain * env;
  }
  return buffer;
}

function generateSfx() {
  // sfx-click
  {
    const len = Math.floor(SAMPLE_RATE * 0.05);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      buf[i] = Math.sin(2 * Math.PI * 650 * t) * 0.35 * Math.exp(-i / (SAMPLE_RATE * 0.008));
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-click.wav"), createWavBuffer(buf));
    console.log("-> sfx-click.wav created");
  }

  // sfx-confirm
  {
    const len = Math.floor(SAMPLE_RATE * 0.2);
    const buf = new Float32Array(len);
    const bell1 = synthMetallic([[880, 0.5], [1760, 0.3]], 0.2, 0.4, 14);
    const bell2 = synthMetallic([[1320, 0.5], [2640, 0.3]], 0.16, 0.35, 16);
    mixTrack(buf, bell1, 0);
    mixTrack(buf, bell2, Math.floor(SAMPLE_RATE * 0.05));
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-confirm.wav"), createWavBuffer(buf));
    console.log("-> sfx-confirm.wav created");
  }

  // sfx-cancel
  {
    const len = Math.floor(SAMPLE_RATE * 0.15);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      buf[i] = Math.sin(2 * Math.PI * (320 - progress * 150) * t) * 0.32 * Math.exp(-progress * 9);
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-cancel.wav"), createWavBuffer(buf));
    console.log("-> sfx-cancel.wav created");
  }

  // sfx-hit
  {
    const len = Math.floor(SAMPLE_RATE * 0.16);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      buf[i] = Math.sin(2 * Math.PI * (160 - progress * 80) * t) * 0.6 * Math.exp(-progress * 12);
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-hit.wav"), createWavBuffer(applyLowPass(buf, 1600)));
    console.log("-> sfx-hit.wav created");
  }

  // sfx-skill
  {
    const len = Math.floor(SAMPLE_RATE * 0.55);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      const f = 220 + progress * 600;
      const env = Math.sin(progress * Math.PI) * Math.exp(-progress * 1.5);
      buf[i] = (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 0.5 * t)) * 0.45 * env;
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-skill.wav"), createWavBuffer(buf));
    console.log("-> sfx-skill.wav created");
  }

  // sfx-reward
  {
    const len = Math.floor(SAMPLE_RATE * 0.45);
    const buf = new Float32Array(len);
    [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
      const bell = synthMetallic([[f, 0.5], [f * 2, 0.25]], 0.3, 0.32, 10);
      mixTrack(buf, bell, Math.floor(SAMPLE_RATE * (idx * 0.08)));
    });
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-reward.wav"), createWavBuffer(buf));
    console.log("-> sfx-reward.wav created");
  }

  // sfx-boss
  {
    const len = Math.floor(SAMPLE_RATE * 0.7);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      buf[i] = Math.sin(2 * Math.PI * (85 - progress * 40) * t) * 0.7 * Math.exp(-progress * 4.5);
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-boss.wav"), createWavBuffer(applyLowPass(buf, 350)));
    console.log("-> sfx-boss.wav created");
  }
}

console.log("=========================================");
console.log(" Generating Heroic Battle Audio Assets   ");
console.log("=========================================");
generateBgm();
generateSfx();
console.log("All audio assets generated successfully in assets/audio/!");

"use strict";

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
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

  // RIFF Chunk
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

function createStereoWavBuffer(left, right, sampleRate = SAMPLE_RATE) {
  const numFrames = Math.min(left.length, right.length);
  const channels = 2;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numFrames; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    const intL = l < 0 ? l * 0x8000 : l * 0x7FFF;
    const intR = r < 0 ? r * 0x8000 : r * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intL), 44 + i * 4);
    buffer.writeInt16LE(Math.floor(intR), 44 + i * 4 + 2);
  }

  return buffer;
}

/* =========================================================================
   DSP 演算法：低通濾波器與立體聲空間混響器
   ========================================================================= */

// 一階低通濾波器（消除刺耳數位高頻）
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

// Schroeder-Moorer 殿堂級空間混響器 (Stereo Hall Reverb)
function applyHallReverb(monoInput, wetLevel = 0.38, dryLevel = 0.85) {
  const len = monoInput.length;
  const outL = new Float32Array(len);
  const outR = new Float32Array(len);

  // 8 個梳狀濾波器延遲長度 (樣點)
  const combDelaysL = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const combDelaysR = [1139, 1211, 1300, 1379, 1445, 1514, 1580, 1640];
  const combFeedback = 0.82;
  const combDamp = 0.22;

  // 4 個全通濾波器
  const allpassDelays = [556, 441, 341, 225];
  const allpassFeedback = 0.5;

  function processChannel(combDelays) {
    const combs = combDelays.map((d) => ({
      buf: new Float32Array(d),
      pos: 0,
      filterState: 0
    }));
    const allpasses = allpassDelays.map((d) => ({
      buf: new Float32Array(d),
      pos: 0
    }));

    const channelOut = new Float32Array(len);

    for (let i = 0; i < len; i++) {
      const inSample = monoInput[i];
      let combSum = 0;

      for (let c = 0; c < combs.length; c++) {
        const comb = combs[c];
        const delayed = comb.buf[comb.pos];
        comb.filterState = delayed * (1 - combDamp) + comb.filterState * combDamp;
        comb.buf[comb.pos] = inSample + comb.filterState * combFeedback;
        comb.pos = (comb.pos + 1) % comb.buf.length;
        combSum += delayed;
      }

      let apOut = combSum * 0.125;
      for (let a = 0; a < allpasses.length; a++) {
        const ap = allpasses[a];
        const delayed = ap.buf[ap.pos];
        const v = apOut - delayed * allpassFeedback;
        ap.buf[ap.pos] = apOut;
        ap.pos = (ap.pos + 1) % ap.buf.length;
        apOut = delayed + v * allpassFeedback;
      }

      channelOut[i] = inSample * dryLevel + apOut * wetLevel;
    }
    return channelOut;
  }

  const left = processChannel(combDelaysL);
  const right = processChannel(combDelaysR);
  return { left, right };
}

/* =========================================================================
   樂器合成器（溫潤弦樂、純淨古箏、大氣戰鼓）
   ========================================================================= */

// 1. 溫暖史詩弦樂合奏 (Warm Strings Ensemble Pad)
function synthStringsChord(freqs, duration, gain = 0.28) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const attackSamples = Math.floor(SAMPLE_RATE * 0.45);
  const releaseSamples = Math.floor(SAMPLE_RATE * 0.65);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    for (let f = 0; f < freqs.length; f++) {
      const freq = freqs[f];
      // 3 振盪器 Detune 營造管弦樂厚度
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = 0.7 * Math.sin(2 * Math.PI * (freq * 1.002) * t);
      const osc3 = 0.7 * Math.sin(2 * Math.PI * (freq * 0.998) * t);
      const sub = 0.4 * Math.sin(2 * Math.PI * (freq * 0.5) * t);
      s += (osc1 + osc2 + osc3 + sub) / 3.0;
    }

    let env = 1.0;
    if (i < attackSamples) env = Math.sin((i / attackSamples) * (Math.PI * 0.5));
    else if (i > numSamples - releaseSamples) env = Math.sin(((numSamples - i) / releaseSamples) * (Math.PI * 0.5));

    buffer[i] = s * (gain / freqs.length) * env;
  }

  return applyLowPass(buffer, 1200); // 溫暖低通
}

// 2. 清脆剔透古箏撥弦 (Pure Guzheng Pluck)
function synthGuzheng(freq, duration, gain = 0.35) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const harmonics = [
    { mult: 1, amp: 1.0, decay: 2.2 },
    { mult: 2, amp: 0.35, decay: 3.2 },
    { mult: 3, amp: 0.15, decay: 4.8 },
    { mult: 4, amp: 0.06, decay: 6.5 }
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (let h = 0; h < harmonics.length; h++) {
      const harm = harmonics[h];
      s += Math.sin(2 * Math.PI * freq * harm.mult * t) * harm.amp * Math.exp(-t * harm.decay);
    }
    const attack = Math.min(1, i / (SAMPLE_RATE * 0.002));
    buffer[i] = s * gain * attack;
  }

  return applyLowPass(buffer, 2800);
}

// 3. 沉穩史詩古戰鼓 (Epic War Taiko Drum)
function synthWarDrum(duration = 0.8, gain = 0.55, startFreq = 85, endFreq = 35) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const t = i / SAMPLE_RATE;
    const currentFreq = startFreq + (endFreq - startFreq) * Math.pow(progress, 0.4);
    const wave = Math.sin(2 * Math.PI * currentFreq * t);
    const env = Math.exp(-progress * 4.8);
    buffer[i] = wave * gain * env;
  }

  return applyLowPass(buffer, 350); // 純低頻共鳴
}

function mixTrack(dest, src, startOffsetSample, volume = 1.0) {
  for (let i = 0; i < src.length; i++) {
    const idx = startOffsetSample + i;
    if (idx < dest.length) dest[idx] += src[i] * volume;
  }
}

/* =========================================================================
   三國史詩 BGM 主生成器
   ========================================================================= */

function generateBgm() {
  console.log("Generating Epic Hall BGM: assets/audio/bgm-main.wav...");
  const duration = 16.0;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const rawMonoTrack = new Float32Array(totalSamples);

  // 音符頻率對照 (Hz)
  const N = {
    D2: 73.42, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81,
    D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63,
    D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25,
    D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
  };

  // 1. 三國經典史詩和弦進行 (每 4 秒換一個和弦，共 4 個段落)
  // Dm (0~4s) -> Bb (4~8s) -> C (8~12s) -> Dm (12~16s)
  const chordProgressions = [
    { freqs: [N.D3, N.F3, N.A3, N.D4], start: 0.0, dur: 4.2 },
    { freqs: [N.Bb2, N.D3, N.F3, N.Bb3], start: 4.0, dur: 4.2 },
    { freqs: [N.C3, N.E3, N.G3, N.C4], start: 8.0, dur: 4.2 },
    { freqs: [N.D3, N.F3, N.A3, N.D4], start: 12.0, dur: 4.2 }
  ];

  chordProgressions.forEach(({ freqs, start, dur }) => {
    const pad = synthStringsChord(freqs, dur, 0.42);
    mixTrack(rawMonoTrack, pad, Math.floor(start * SAMPLE_RATE));
  });

  // 2. 沉穩戰鼓節奏 (每 1 秒一擊，每 4 秒一聲重鼓)
  for (let t = 0; t < duration; t += 1.0) {
    const isHeavy = (Math.round(t) % 4 === 0);
    const drum = synthWarDrum(0.8, isHeavy ? 0.55 : 0.32, isHeavy ? 90 : 75, 32);
    mixTrack(rawMonoTrack, drum, Math.floor(t * SAMPLE_RATE));
  }

  // 3. 桃園豪情五聲古箏流水旋律 (悠揚純淨)
  const guzhengNotes = [
    // Dm 段落
    { note: N.D4, t: 0.0, d: 1.2 }, { note: N.F4, t: 0.5, d: 1.0 }, { note: N.A4, t: 1.0, d: 1.6 }, { note: N.D5, t: 2.0, d: 1.4 }, { note: N.A4, t: 3.0, d: 1.2 },
    // Bb 段落
    { note: N.Bb4, t: 4.0, d: 1.4 }, { note: N.D5, t: 4.8, d: 1.2 }, { note: N.F5, t: 5.6, d: 1.8 }, { note: N.D5, t: 6.6, d: 1.4 }, { note: N.Bb4, t: 7.2, d: 1.0 },
    // C 段落
    { note: N.C5, t: 8.0, d: 1.5 }, { note: N.G4, t: 8.8, d: 1.2 }, { note: N.E4, t: 9.6, d: 1.4 }, { note: N.G4, t: 10.4, d: 1.2 }, { note: N.C5, t: 11.0, d: 1.6 },
    // Dm 終止段落
    { note: N.A4, t: 12.0, d: 1.4 }, { note: N.F4, t: 12.8, d: 1.2 }, { note: N.E4, t: 13.6, d: 1.4 }, { note: N.D4, t: 14.4, d: 2.2 }
  ];

  guzhengNotes.forEach(({ note, t, d }) => {
    const gz = synthGuzheng(note, d, 0.38);
    mixTrack(rawMonoTrack, gz, Math.floor(t * SAMPLE_RATE));
  });

  // 4. 通過立體聲殿堂混響器 (Stereo Hall Reverb) 渲染
  console.log("Applying Stereo Hall Reverb & Acoustics...");
  const { left, right } = applyHallReverb(rawMonoTrack, 0.42, 0.78);

  // 5. 無縫淡入淡出 (Cross-fade 0.2s)
  const fadeLen = Math.floor(SAMPLE_RATE * 0.2);
  for (let i = 0; i < fadeLen; i++) {
    const fade = i / fadeLen;
    left[i] *= fade;
    right[i] *= fade;
    left[totalSamples - 1 - i] *= fade;
    right[totalSamples - 1 - i] *= fade;
  }

  // 6. 正規化 (Normalize to -1.5 dB)
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(left[i]) > peak) peak = Math.abs(left[i]);
    if (Math.abs(right[i]) > peak) peak = Math.abs(right[i]);
  }
  if (peak > 0.85) {
    const factor = 0.85 / peak;
    for (let i = 0; i < totalSamples; i++) {
      left[i] *= factor;
      right[i] *= factor;
    }
  }

  const wavBuf = createStereoWavBuffer(left, right);
  fs.writeFileSync(path.join(AUDIO_DIR, "bgm-main.wav"), wavBuf);
  console.log("-> bgm-main.wav created with Stereo Hall Reverb (" + (wavBuf.length / 1024).toFixed(1) + " KB)");
}

/* =========================================================================
   打擊與技能音效生成
   ========================================================================= */

function synthMetallic(freqs, duration = 0.4, gain = 0.5, decaySpeed = 12) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const env = Math.exp(-progress * decaySpeed);
    let sample = 0;

    for (let j = 0; j < freqs.length; j++) {
      const [f, amp, phase] = freqs[j];
      sample += Math.sin(2 * Math.PI * f * t + (phase || 0)) * amp;
    }

    if (i < SAMPLE_RATE * 0.005) {
      sample += (Math.random() * 2 - 1) * 0.4 * (1 - i / (SAMPLE_RATE * 0.005));
    }

    buffer[i] = sample * gain * env;
  }

  return buffer;
}

function generateSfx() {
  // sfx-click
  {
    const dur = 0.05;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-i / (SAMPLE_RATE * 0.008));
      buf[i] = Math.sin(2 * Math.PI * 650 * t) * 0.35 * env;
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-click.wav"), createWavBuffer(buf));
    console.log("-> sfx-click.wav created");
  }

  // sfx-confirm
  {
    const dur = 0.22;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const bell1 = synthMetallic([[880, 0.5], [1760, 0.3], [2640, 0.15]], 0.22, 0.4, 14);
    const bell2 = synthMetallic([[1320, 0.5], [2640, 0.3]], 0.18, 0.35, 16);
    mixTrack(buf, bell1, 0);
    mixTrack(buf, bell2, Math.floor(SAMPLE_RATE * 0.06));
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-confirm.wav"), createWavBuffer(buf));
    console.log("-> sfx-confirm.wav created");
  }

  // sfx-cancel
  {
    const dur = 0.16;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      const f = 340 - progress * 160;
      const env = Math.exp(-progress * 9);
      buf[i] = Math.sin(2 * Math.PI * f * t) * 0.32 * env;
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-cancel.wav"), createWavBuffer(buf));
    console.log("-> sfx-cancel.wav created");
  }

  // sfx-hit
  {
    const dur = 0.18;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      const f = 160 - progress * 90;
      const env = Math.exp(-progress * 14);
      const impact = (Math.random() * 2 - 1) * Math.exp(-progress * 30) * 0.5;
      buf[i] = (Math.sin(2 * Math.PI * f * t) * 0.5 + impact) * 0.6 * env;
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-hit.wav"), createWavBuffer(applyLowPass(buf, 1800)));
    console.log("-> sfx-hit.wav created");
  }

  // sfx-skill
  {
    const dur = 0.65;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      const f = 220 + progress * 660;
      const env = Math.sin(progress * Math.PI) * Math.exp(-progress * 1.5);
      const sweep = Math.sin(2 * Math.PI * f * t);
      const sub = Math.sin(2 * Math.PI * (f * 0.5) * t) * 0.5;
      buf[i] = (sweep + sub) * 0.45 * env;
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-skill.wav"), createWavBuffer(buf));
    console.log("-> sfx-skill.wav created");
  }

  // sfx-reward
  {
    const dur = 0.5;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const arpeg = [523.25, 659.25, 783.99, 1046.50];
    arpeg.forEach((f, idx) => {
      const bell = synthMetallic([[f, 0.5], [f * 2, 0.25]], 0.35, 0.35, 10);
      mixTrack(buf, bell, Math.floor(SAMPLE_RATE * (idx * 0.08)));
    });
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-reward.wav"), createWavBuffer(buf));
    console.log("-> sfx-reward.wav created");
  }

  // sfx-boss
  {
    const dur = 0.75;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const t = i / SAMPLE_RATE;
      const f = 85 - progress * 45;
      const env = Math.exp(-progress * 4.5);
      const heavy = (Math.random() * 2 - 1) * Math.exp(-progress * 22) * 0.6;
      buf[i] = (Math.sin(2 * Math.PI * f * t) * 0.7 + heavy) * 0.7 * env;
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-boss.wav"), createWavBuffer(applyLowPass(buf, 400)));
    console.log("-> sfx-boss.wav created");
  }
}

console.log("=========================================");
console.log(" Generating Game Audio Assets (Pure DSP) ");
console.log("=========================================");
generateBgm();
generateSfx();
console.log("All audio assets generated successfully in assets/audio/!");

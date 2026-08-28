"use strict";

const fs = require("fs");
const path = require("path");

// 採用 22050 Hz 輕量取樣率：檔案小、載入快、長度超長（64 秒）
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

// 柔和低通濾波器（使音質溫潤、不刺耳）
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

// 空間混響器 (Mono Reverb，輕量自然)
function applySimpleReverb(input, delaySeconds = 0.18, feedback = 0.35, wet = 0.28) {
  const delaySamples = Math.floor(SAMPLE_RATE * delaySeconds);
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const delayed = i >= delaySamples ? output[i - delaySamples] : 0;
    output[i] = input[i] + delayed * feedback;
  }
  const result = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    result[i] = input[i] * (1 - wet) + output[i] * wet;
  }
  return result;
}

/* =========================================================================
   樂器合成器
   ========================================================================= */

// 1. 溫暖弦樂合奏鋪底 (Strings Pad)
function synthStringsChord(freqs, duration, gain = 0.32) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const attack = Math.floor(SAMPLE_RATE * 0.4);
  const release = Math.floor(SAMPLE_RATE * 0.6);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (let f = 0; f < freqs.length; f++) {
      const freq = freqs[f];
      s += Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 1.002 * t);
    }
    let env = 1.0;
    if (i < attack) env = i / attack;
    else if (i > numSamples - release) env = (numSamples - i) / release;
    buffer[i] = s * (gain / freqs.length) * env;
  }
  return applyLowPass(buffer, 900);
}

// 2. 清脆古箏撥弦 (Guzheng)
function synthGuzheng(freq, duration, gain = 0.38) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const s = Math.sin(2 * Math.PI * freq * t) +
              0.35 * Math.sin(2 * Math.PI * freq * 2 * t) +
              0.15 * Math.sin(2 * Math.PI * freq * 3 * t);
    const env = Math.exp(-t * 2.5);
    const att = Math.min(1, i / (SAMPLE_RATE * 0.003));
    buffer[i] = s * gain * env * att;
  }
  return applyLowPass(buffer, 2200);
}

// 3. 沉穩戰鼓 (Taiko War Drum)
function synthDrum(duration = 0.6, gain = 0.45, startFreq = 85, endFreq = 38) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const t = i / SAMPLE_RATE;
    const f = startFreq + (endFreq - startFreq) * Math.pow(progress, 0.4);
    const env = Math.exp(-progress * 5.0);
    buffer[i] = Math.sin(2 * Math.PI * f * t) * gain * env;
  }
  return applyLowPass(buffer, 300);
}

// 4. 古編鐘 (Chime)
function synthChime(freq, duration = 2.0, gain = 0.22) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const s = Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * (freq * 1.414) * t) * 0.3;
    const env = Math.exp(-t * 2.0);
    buffer[i] = s * gain * env;
  }
  return buffer;
}

function mixTrack(dest, src, startOffsetSample, volume = 1.0) {
  for (let i = 0; i < src.length; i++) {
    const idx = startOffsetSample + i;
    if (idx < dest.length) dest[idx] += src[i] * volume;
  }
}

/* =========================================================================
   64 秒超長四樂章三國古風 BGM 生成
   ========================================================================= */

function generateBgm() {
  console.log("Generating 64-second Epic BGM: assets/audio/bgm-main.wav...");
  const duration = 64.0; // 64 秒完整大樂章
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const track = new Float32Array(totalSamples);

  const N = {
    D2: 73.42, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81,
    D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63,
    D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25,
    D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
  };

  // 1. 弦樂背景和聲 (16 個 4 秒和弦進行)
  const chordProg = [
    // 樂章一：桃園初誓 (0~16s)
    { freqs: [N.D3, N.F3, N.A3], start: 0, dur: 4.2 },
    { freqs: [N.Bb2, N.D3, N.F3], start: 4, dur: 4.2 },
    { freqs: [N.C3, N.E3, N.G3], start: 8, dur: 4.2 },
    { freqs: [N.D3, N.F3, N.A3], start: 12, dur: 4.2 },

    // 樂章二：漢末烽火 (16~32s)
    { freqs: [N.G2, N.Bb2, N.D3], start: 16, dur: 4.2 },
    { freqs: [N.F2, N.A2, N.C3], start: 20, dur: 4.2 },
    { freqs: [N.Bb2, N.D3, N.F3], start: 24, dur: 4.2 },
    { freqs: [N.A2, N.C3, N.E3], start: 28, dur: 4.2 },

    // 樂章三：赤壁鏖兵 (32~48s)
    { freqs: [N.D3, N.F3, N.A3, N.D4], start: 32, dur: 4.2 },
    { freqs: [N.Bb2, N.D3, N.F3, N.Bb3], start: 36, dur: 4.2 },
    { freqs: [N.C3, N.E3, N.G3, N.C4], start: 40, dur: 4.2 },
    { freqs: [N.D3, N.F3, N.A3, N.D4], start: 44, dur: 4.2 },

    // 樂章四：天下三分 (48~64s)
    { freqs: [N.G2, N.Bb2, N.D3], start: 48, dur: 4.2 },
    { freqs: [N.C3, N.E3, N.G3], start: 52, dur: 4.2 },
    { freqs: [N.A2, N.C3, N.E3], start: 56, dur: 4.2 },
    { freqs: [N.D3, N.F3, N.A3], start: 60, dur: 4.2 }
  ];

  chordProg.forEach(({ freqs, start, dur }) => {
    const pad = synthStringsChord(freqs, dur, 0.38);
    mixTrack(track, pad, Math.floor(start * SAMPLE_RATE));
  });

  // 2. 戰鼓節奏 (從 16s 開始加入，32s 進入雙重戰鼓)
  for (let t = 16.0; t < 62.0; t += 1.0) {
    const isHeavy = (Math.round(t) % 4 === 0);
    const drum = synthDrum(0.65, isHeavy ? 0.45 : 0.25, isHeavy ? 90 : 75, 35);
    mixTrack(track, drum, Math.floor(t * SAMPLE_RATE));

    if (t >= 32.0 && t < 48.0 && !isHeavy) {
      const subDrum = synthDrum(0.35, 0.18, 110, 50);
      mixTrack(track, subDrum, Math.floor((t + 0.5) * SAMPLE_RATE));
    }
  }

  // 3. 古編鐘 (每 8 秒敲響一聲大氣編鐘)
  for (let t = 0; t < 64.0; t += 8.0) {
    const chime = synthChime(N.D4, 3.0, 0.22);
    mixTrack(track, chime, Math.floor(t * SAMPLE_RATE));
  }

  // 4. 64 秒長篇五聲音階古箏主旋律 (起承轉合)
  const guzhengMelody = [
    // 樂章一 (0~16s)
    { note: N.D4, t: 0.5, d: 1.5 }, { note: N.F4, t: 2.0, d: 1.2 }, { note: N.A4, t: 3.2, d: 1.8 }, { note: N.D5, t: 4.5, d: 1.6 },
    { note: N.A4, t: 6.0, d: 1.4 }, { note: N.F4, t: 7.2, d: 1.2 }, { note: N.E4, t: 8.5, d: 1.5 }, { note: N.D4, t: 10.0, d: 2.2 },
    { note: N.F4, t: 12.5, d: 1.4 }, { note: N.A4, t: 14.0, d: 1.8 },

    // 樂章二 (16~32s)
    { note: N.D5, t: 16.5, d: 1.4 }, { note: N.C5, t: 18.0, d: 1.2 }, { note: N.Bb4, t: 19.2, d: 1.6 }, { note: N.A4, t: 20.8, d: 1.4 },
    { note: N.G4, t: 22.2, d: 1.2 }, { note: N.A4, t: 23.5, d: 1.5 }, { note: N.D5, t: 25.0, d: 2.0 }, { note: N.F5, t: 27.2, d: 1.6 },
    { note: N.E5, t: 29.0, d: 1.4 }, { note: N.D5, t: 30.5, d: 1.8 },

    // 樂章三：高潮華彩 (32~48s)
    { note: N.A4, t: 32.2, d: 1.0 }, { note: N.D5, t: 33.0, d: 1.2 }, { note: N.F5, t: 34.2, d: 1.5 }, { note: N.G5, t: 35.5, d: 1.8 },
    { note: N.F5, t: 37.0, d: 1.2 }, { note: N.D5, t: 38.2, d: 1.4 }, { note: N.C5, t: 39.5, d: 1.2 }, { note: N.D5, t: 40.8, d: 2.0 },
    { note: N.F5, t: 42.5, d: 1.5 }, { note: N.E5, t: 44.0, d: 1.4 }, { note: N.D5, t: 45.5, d: 2.2 },

    // 樂章四：歸隱天下 (48~64s)
    { note: N.A4, t: 48.5, d: 1.6 }, { note: N.F4, t: 50.2, d: 1.4 }, { note: N.G4, t: 52.0, d: 1.6 }, { note: N.E4, t: 54.0, d: 1.8 },
    { note: N.D4, t: 56.5, d: 2.0 }, { note: N.F4, t: 58.5, d: 1.5 }, { note: N.E4, t: 60.0, d: 1.6 }, { note: N.D4, t: 61.8, d: 2.4 }
  ];

  guzhengMelody.forEach(({ note, t, d }) => {
    const gz = synthGuzheng(note, d, 0.36);
    mixTrack(track, gz, Math.floor(t * SAMPLE_RATE));
  });

  // 5. 加上柔和空間混響
  const reverbedTrack = applySimpleReverb(track, 0.22, 0.32, 0.25);

  // 6. 無縫循環淡入淡出 (Cross-fade 0.4s)
  const fadeLen = Math.floor(SAMPLE_RATE * 0.4);
  for (let i = 0; i < fadeLen; i++) {
    const fade = i / fadeLen;
    reverbedTrack[i] *= fade;
    reverbedTrack[totalSamples - 1 - i] *= fade;
  }

  // 7. 響度正規化
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(reverbedTrack[i]) > peak) peak = Math.abs(reverbedTrack[i]);
  }
  if (peak > 0.85) {
    const factor = 0.85 / peak;
    for (let i = 0; i < totalSamples; i++) reverbedTrack[i] *= factor;
  }

  const wavBuf = createWavBuffer(reverbedTrack);
  fs.writeFileSync(path.join(AUDIO_DIR, "bgm-main.wav"), wavBuf);
  console.log("-> bgm-main.wav created (" + duration + "s, " + (wavBuf.length / 1024).toFixed(1) + " KB)");
}

/* =========================================================================
   打擊音效生成
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
console.log(" Generating 64s Lightweight Audio Assets ");
console.log("=========================================");
generateBgm();
generateSfx();
console.log("All audio assets generated successfully in assets/audio/!");

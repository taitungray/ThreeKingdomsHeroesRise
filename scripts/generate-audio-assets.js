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

function synthPluck(freq, duration, gain = 0.45) {
  // 純淨古箏/琵琶物理多泛音諧波模型（無白噪聲雜音）
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const harmonics = [
    { mult: 1, amp: 1.0, decay: 1.8 },
    { mult: 2, amp: 0.45, decay: 2.6 },
    { mult: 3, amp: 0.22, decay: 3.8 },
    { mult: 4, amp: 0.10, decay: 5.2 },
    { mult: 5, amp: 0.04, decay: 7.0 }
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (let h = 0; h < harmonics.length; h++) {
      const harm = harmonics[h];
      const env = Math.exp(-t * harm.decay);
      s += Math.sin(2 * Math.PI * freq * harm.mult * t) * harm.amp * env;
    }
    // 溫和的起振瞬態
    const attack = Math.min(1, i / (SAMPLE_RATE * 0.003));
    buffer[i] = s * gain * attack;
  }

  return buffer;
}

function synthFlute(freq, duration, gain = 0.28) {
  // 溫潤空靈的竹笛/洞簫音色
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const attackSamples = Math.floor(SAMPLE_RATE * 0.12);
  const releaseSamples = Math.floor(SAMPLE_RATE * 0.22);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // 溫和悠揚的自然揉弦顫音 (4.2 Hz, 0.4% 幅度)
    const vibrato = 1 + 0.004 * Math.sin(2 * Math.PI * 4.2 * t);
    const f = freq * vibrato;

    const s1 = Math.sin(2 * Math.PI * f * t);
    const s2 = 0.25 * Math.sin(2 * Math.PI * f * 2 * t);
    const s3 = 0.08 * Math.sin(2 * Math.PI * f * 3 * t);

    let env = 1.0;
    if (i < attackSamples) env = Math.sin((i / attackSamples) * (Math.PI * 0.5));
    else if (i > numSamples - releaseSamples) env = Math.sin(((numSamples - i) / releaseSamples) * (Math.PI * 0.5));

    buffer[i] = (s1 + s2 + s3) * gain * env;
  }

  return buffer;
}

function synthDrum(duration = 0.55, gain = 0.55, startFreq = 95, endFreq = 38) {
  // 沉穩雄渾的三國古戰鼓
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const t = i / SAMPLE_RATE;
    const currentFreq = startFreq + (endFreq - startFreq) * Math.pow(progress, 0.45);
    const env = Math.exp(-progress * 5.2);
    const wave = Math.sin(2 * Math.PI * currentFreq * t);
    buffer[i] = wave * gain * env;
  }

  return buffer;
}

function synthGong(freq = 240, duration = 2.2, gain = 0.18) {
  // 悠遠編鐘/古磬
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 2.2);
    const s1 = Math.sin(2 * Math.PI * freq * t) * 0.7;
    const s2 = Math.sin(2 * Math.PI * (freq * 1.414) * t) * 0.3;
    buffer[i] = (s1 + s2) * gain * env;
  }
  return buffer;
}

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

function mixInto(dest, src, startOffsetSample, volume = 1.0) {
  for (let i = 0; i < src.length; i++) {
    const targetIdx = startOffsetSample + i;
    if (targetIdx < dest.length) {
      dest[targetIdx] += src[i] * volume;
    }
  }
}

function generateBgm() {
  console.log("Generating BGM: assets/audio/bgm-main.wav...");
  const duration = 16.0;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const bgmTrack = new Float32Array(totalSamples);

  // 中國羽調式五聲音階 (A - C - D - E - G)
  const notes = {
    A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
    A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
    A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
  };

  // 1. 沉穩戰鼓節奏 (每拍 0.8 秒，共 20 拍)
  const beatTime = 0.8;
  for (let t = 0; t < duration; t += beatTime) {
    const beatIndex = Math.round(t / beatTime);
    const isHeavy = (beatIndex % 4 === 0);
    const drum = synthDrum(0.65, isHeavy ? 0.42 : 0.22, isHeavy ? 100 : 85, 36);
    mixInto(bgmTrack, drum, Math.floor(t * SAMPLE_RATE));

    if (isHeavy) {
      const gong = synthGong(220, 2.0, 0.14);
      mixInto(bgmTrack, gong, Math.floor(t * SAMPLE_RATE));
    }
  }

  // 2. 桃園豪情古箏彈奏旋律 (純五聲音階)
  const guzhengMelody = [
    { note: "A3", time: 0.0, dur: 1.5 }, { note: "C4", time: 0.8, dur: 1.2 }, { note: "D4", time: 1.6, dur: 1.8 }, { note: "E4", time: 2.4, dur: 1.4 },
    { note: "G4", time: 3.2, dur: 1.6 }, { note: "E4", time: 4.0, dur: 1.4 }, { note: "D4", time: 4.8, dur: 1.8 }, { note: "C4", time: 5.6, dur: 1.4 },
    { note: "D4", time: 6.4, dur: 2.2 }, { note: "E4", time: 8.0, dur: 1.5 }, { note: "G4", time: 8.8, dur: 1.4 }, { note: "A4", time: 9.6, dur: 2.0 },
    { note: "G4", time: 10.4, dur: 1.4 }, { note: "E4", time: 11.2, dur: 1.6 }, { note: "D4", time: 12.0, dur: 1.4 }, { note: "C4", time: 12.8, dur: 1.4 },
    { note: "D4", time: 13.6, dur: 1.8 }, { note: "A3", time: 14.4, dur: 2.4 }
  ];

  guzhengMelody.forEach(({ note, time, dur }) => {
    if (notes[note]) {
      const gz = synthPluck(notes[note], dur, 0.36);
      mixInto(bgmTrack, gz, Math.floor(time * SAMPLE_RATE));

      // 伴奏低音
      const lowNote = note.replace("4", "3").replace("3", "2");
      if (notes[lowNote] && time % 1.6 === 0) {
        const bass = synthPluck(notes[lowNote], dur * 1.3, 0.26);
        mixInto(bgmTrack, bass, Math.floor(time * SAMPLE_RATE));
      }
    }
  });

  // 3. 悠揚竹笛悠遠合奏
  const flutePhrases = [
    { note: "A4", time: 3.2, dur: 2.2 },
    { note: "C5", time: 5.6, dur: 2.0 },
    { note: "D5", time: 8.0, dur: 2.6 },
    { note: "E5", time: 10.4, dur: 2.2 },
    { note: "D5", time: 12.0, dur: 2.0 },
    { note: "A4", time: 13.6, dur: 2.8 }
  ];

  flutePhrases.forEach(({ note, time, dur }) => {
    if (notes[note]) {
      const flute = synthFlute(notes[note], dur, 0.22);
      mixInto(bgmTrack, flute, Math.floor(time * SAMPLE_RATE));
    }
  });

  // 4. 無縫循環交叉淡入淡出 (Cross-fade 0.2s)
  const fadeLen = Math.floor(SAMPLE_RATE * 0.15);
  for (let i = 0; i < fadeLen; i++) {
    const fade = i / fadeLen;
    bgmTrack[i] *= fade;
    bgmTrack[totalSamples - 1 - i] *= fade;
  }

  // 5. 峰值正規化 (平穩響度)
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(bgmTrack[i]) > maxPeak) maxPeak = Math.abs(bgmTrack[i]);
  }
  if (maxPeak > 0.88) {
    const ratio = 0.88 / maxPeak;
    for (let i = 0; i < totalSamples; i++) bgmTrack[i] *= ratio;
  }

  const wavBuf = createWavBuffer(bgmTrack);
  fs.writeFileSync(path.join(AUDIO_DIR, "bgm-main.wav"), wavBuf);
  console.log("-> bgm-main.wav created (" + (wavBuf.length / 1024).toFixed(1) + " KB)");
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
      const s = Math.sin(2 * Math.PI * 1400 * t) * 0.6 + Math.sin(2 * Math.PI * 2800 * t) * 0.3;
      const click = (Math.random() * 2 - 1) * Math.exp(-i / (SAMPLE_RATE * 0.002)) * 0.5;
      buf[i] = (s + click) * env * 0.6;
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
    const bell2 = synthMetallic([[1174, 0.6], [2349, 0.35], [3520, 0.2]], 0.18, 0.45, 12);
    mixInto(buf, bell1, 0);
    mixInto(buf, bell2, Math.floor(SAMPLE_RATE * 0.05));
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-confirm.wav"), createWavBuffer(buf));
    console.log("-> sfx-confirm.wav created");
  }

  // sfx-cancel
  {
    const dur = 0.16;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const f = 240 * Math.pow(110 / 240, t / dur);
      const env = Math.exp(-i / (SAMPLE_RATE * 0.04));
      buf[i] = Math.sin(2 * Math.PI * f * t) * 0.5 * env;
    }
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-cancel.wav"), createWavBuffer(buf));
    console.log("-> sfx-cancel.wav created");
  }

  // sfx-hit
  {
    const dur = 0.22;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const thud = synthDrum(0.18, 0.65, 220, 60);
    mixInto(buf, thud, 0);
    const clank = synthMetallic([[1800, 0.5], [3200, 0.4], [5400, 0.25]], 0.15, 0.55, 25);
    mixInto(buf, clank, Math.floor(SAMPLE_RATE * 0.003));
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-hit.wav"), createWavBuffer(buf));
    console.log("-> sfx-hit.wav created");
  }

  // sfx-skill
  {
    const dur = 0.45;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const progress = i / len;
      const f = 220 + 780 * Math.pow(progress, 1.8);
      const swoosh = Math.sin(2 * Math.PI * f * t) * (0.3 + 0.4 * Math.sin(progress * Math.PI));
      const noise = (Math.random() * 2 - 1) * Math.sin(progress * Math.PI) * 0.35;
      const env = Math.sin(progress * Math.PI);
      buf[i] = (swoosh + noise) * env * 0.7;
    }
    const burst = synthMetallic([[659, 0.4], [1318, 0.3], [1975, 0.2]], 0.25, 0.5, 10);
    mixInto(buf, burst, Math.floor(SAMPLE_RATE * 0.2));
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-skill.wav"), createWavBuffer(buf));
    console.log("-> sfx-skill.wav created");
  }

  // sfx-reward
  {
    const dur = 0.45;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const coinPitches = [987.77, 1318.51, 1567.98, 2093.00];
    coinPitches.forEach((p, idx) => {
      const coin = synthMetallic([[p, 0.6], [p * 2.02, 0.3], [p * 3.1, 0.15]], 0.22, 0.45, 14);
      mixInto(buf, coin, Math.floor(SAMPLE_RATE * (0.05 + idx * 0.075)));
    });
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-reward.wav"), createWavBuffer(buf));
    console.log("-> sfx-reward.wav created");
  }

  // sfx-boss
  {
    const dur = 0.65;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const bigDrum = synthDrum(0.65, 0.9, 130, 32);
    mixInto(buf, bigDrum, 0);
    const roar = synthMetallic([[110, 0.5], [220, 0.4], [330, 0.3], [75, 0.6]], 0.55, 0.5, 6);
    mixInto(buf, roar, Math.floor(SAMPLE_RATE * 0.04));
    fs.writeFileSync(path.join(AUDIO_DIR, "sfx-boss.wav"), createWavBuffer(buf));
    console.log("-> sfx-boss.wav created");
  }
}

generateBgm();
generateSfx();
console.log("All audio assets generated successfully in assets/audio/!");

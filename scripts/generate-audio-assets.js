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

function synthPluck(freq, duration, gain = 0.5, damping = 0.988) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const period = Math.max(2, Math.round(SAMPLE_RATE / freq));
  const delayLine = new Float32Array(period);

  for (let i = 0; i < period; i++) {
    delayLine[i] = (Math.random() * 2 - 1) * gain;
  }

  let p = 0;
  for (let i = 0; i < numSamples; i++) {
    const nextP = (p + 1) % period;
    const newSample = ((delayLine[p] + delayLine[nextP]) * 0.5) * damping;
    delayLine[p] = newSample;
    buffer[i] = newSample;
    p = nextP;
  }

  return buffer;
}

function synthFlute(freq, duration, gain = 0.3) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);
  const attack = Math.floor(SAMPLE_RATE * 0.08);
  const release = Math.floor(SAMPLE_RATE * 0.12);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const vib = 1 + 0.012 * Math.sin(2 * Math.PI * 5 * t);
    const f = freq * vib;
    const s1 = Math.sin(2 * Math.PI * f * t);
    const s2 = 0.35 * Math.sin(2 * Math.PI * f * 2 * t);
    const s3 = 0.15 * Math.sin(2 * Math.PI * f * 3 * t);
    const s4 = 0.08 * Math.sin(2 * Math.PI * f * 4 * t);
    const breath = (Math.random() * 2 - 1) * 0.025;

    let env = 1;
    if (i < attack) env = i / attack;
    else if (i > numSamples - release) env = (numSamples - i) / release;

    buffer[i] = (s1 + s2 + s3 + s4 + breath) * gain * env;
  }

  return buffer;
}

function synthDrum(duration = 0.6, gain = 0.7, startFreq = 140, endFreq = 45) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const f = startFreq * Math.pow(endFreq / startFreq, progress);
    const wave = Math.sin(2 * Math.PI * f * t);
    const punch = (Math.random() * 2 - 1) * Math.exp(-progress * 30) * 0.4;
    const env = Math.exp(-progress * 6.5);
    buffer[i] = (wave * 0.8 + punch) * gain * env;
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

  const notes = {
    D3: 146.83, E3: 164.81, Fs3: 185.00, A3: 220.00, B3: 246.94,
    D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440.00, B4: 493.88,
    D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880.00
  };

  for (let t = 0; t < duration; t += 1.0) {
    const isStrong = (Math.floor(t) % 4 === 0);
    const drum = synthDrum(0.7, isStrong ? 0.45 : 0.28, isStrong ? 120 : 100, 40);
    mixInto(bgmTrack, drum, Math.floor(t * SAMPLE_RATE));

    if (!isStrong) {
      const lightDrum = synthDrum(0.35, 0.15, 180, 70);
      mixInto(bgmTrack, lightDrum, Math.floor((t + 0.5) * SAMPLE_RATE));
    }
  }

  const pluckMelody = [
    { note: "D4", time: 0.0, dur: 1.4 }, { note: "Fs4", time: 0.5, dur: 1.2 }, { note: "A4", time: 1.0, dur: 1.8 }, { note: "B4", time: 2.0, dur: 1.2 },
    { note: "A4", time: 2.5, dur: 1.4 }, { note: "Fs4", time: 3.2, dur: 1.6 }, { note: "D4", time: 4.0, dur: 1.8 }, { note: "E4", time: 5.0, dur: 1.4 },
    { note: "Fs4", time: 5.8, dur: 1.8 }, { note: "A4", time: 6.5, dur: 1.5 }, { note: "B4", time: 7.2, dur: 1.2 }, { note: "D5", time: 8.0, dur: 2.0 },
    { note: "B4", time: 9.0, dur: 1.4 }, { note: "A4", time: 9.8, dur: 1.6 }, { note: "Fs4", time: 10.6, dur: 1.4 }, { note: "E4", time: 11.4, dur: 1.8 },
    { note: "D4", time: 12.2, dur: 1.5 }, { note: "Fs4", time: 13.0, dur: 1.4 }, { note: "E4", time: 14.0, dur: 1.8 }, { note: "D4", time: 15.0, dur: 2.2 }
  ];

  pluckMelody.forEach(({ note, time, dur }) => {
    if (notes[note]) {
      const p = synthPluck(notes[note], dur, 0.38, 0.991);
      mixInto(bgmTrack, p, Math.floor(time * SAMPLE_RATE));
      const lowNote = note.replace("4", "3").replace("5", "4");
      if (notes[lowNote] && time % 2.0 === 0) {
        const bass = synthPluck(notes[lowNote], dur * 1.2, 0.25, 0.994);
        mixInto(bgmTrack, bass, Math.floor(time * SAMPLE_RATE));
      }
    }
  });

  const flutePhrases = [
    { note: "A4", time: 4.0, dur: 1.6 },
    { note: "B4", time: 5.6, dur: 1.4 },
    { note: "D5", time: 7.0, dur: 2.4 },
    { note: "Fs5", time: 9.4, dur: 1.8 },
    { note: "E5", time: 11.2, dur: 2.0 },
    { note: "D5", time: 13.2, dur: 2.6 }
  ];

  flutePhrases.forEach(({ note, time, dur }) => {
    if (notes[note]) {
      const flute = synthFlute(notes[note], dur, 0.22);
      mixInto(bgmTrack, flute, Math.floor(time * SAMPLE_RATE));
    }
  });

  const fadeLen = Math.floor(SAMPLE_RATE * 0.1);
  for (let i = 0; i < fadeLen; i++) {
    const fade = i / fadeLen;
    bgmTrack[i] *= fade;
    bgmTrack[totalSamples - 1 - i] *= fade;
  }

  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    if (Math.abs(bgmTrack[i]) > maxPeak) maxPeak = Math.abs(bgmTrack[i]);
  }
  if (maxPeak > 0.95) {
    const ratio = 0.95 / maxPeak;
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

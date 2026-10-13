/**
 * Binaural Flow & Ambient Soundscapes Synthesizer
 * Zero-dependency Web Audio API procedural sound engine (100% offline).
 * Generates 40Hz Gamma Focus binaural beats, Pink Rain, Deep Ocean, and Zen Drone.
 */

class BinauralSoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.currentMode = null;
    this.isPlayingState = false;
    this.volume = 0.5;
    this.nodes = [];
    this.gainNode = null;
    this.listeners = new Set();
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn({
      isPlaying: this.isPlayingState,
      mode: this.currentMode,
      volume: this.volume
    }));
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume * 0.4, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  stop() {
    if (!this.isPlayingState) return;
    
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
      } catch (e) {}
    }

    setTimeout(() => {
      this.cleanupNodes();
      this.isPlayingState = false;
      this.currentMode = null;
      this.notify();
    }, 150);
  }

  cleanupNodes() {
    this.nodes.forEach((n) => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch (e) {}
      this.gainNode = null;
    }
  }

  start(mode = 'gamma') {
    this.init();
    if (!this.ctx) return;

    if (this.isPlayingState) {
      this.stop();
    }

    setTimeout(() => {
      this.currentMode = mode;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.gainNode.gain.setTargetAtTime(this.volume * 0.4, this.ctx.currentTime, 0.2);
      this.gainNode.connect(this.ctx.destination);

      if (mode === 'gamma') {
        this.createGammaBeat();
      } else if (mode === 'pinkRain') {
        this.createPinkRain();
      } else if (mode === 'ocean') {
        this.createOceanWaves();
      } else if (mode === 'zenDrone') {
        this.createZenDrone();
      }

      this.isPlayingState = true;
      this.notify();
    }, 180);
  }

  /**
   * 40Hz Gamma Cognitive Synchronization (Left 216Hz, Right 256Hz)
   */
  createGammaBeat() {
    const t = this.ctx.currentTime;

    // Left channel: 216Hz carrier
    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(216, t);

    // Right channel: 256Hz (256 - 216 = 40Hz beat frequency)
    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(256, t);

    // Channel merger for true binaural stereo separation
    const merger = this.ctx.createChannelMerger(2);
    oscL.connect(merger, 0, 0); // Left ear
    oscR.connect(merger, 0, 1); // Right ear

    // Subtle warm sub-bass warmth (108Hz)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(108, t);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.2, t);
    subOsc.connect(subGain);
    subGain.connect(merger, 0, 0);
    subGain.connect(merger, 0, 1);

    merger.connect(this.gainNode);

    oscL.start(t);
    oscR.start(t);
    subOsc.start(t);

    this.nodes.push(oscL, oscR, subOsc, subGain, merger);
  }

  /**
   * Generates Pink Noise Buffer (Rain on glass acoustics)
   */
  createPinkNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds looped
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Rain on Glass - Filtered pink noise with soft droplet resonance
   */
  createPinkRain() {
    const buffer = this.createPinkNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter simulating rain outside glass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Highpass to eliminate heavy mud
    const hpFilter = this.ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(hpFilter);
    hpFilter.connect(this.gainNode);

    noise.start(this.ctx.currentTime);
    this.nodes.push(noise, filter, hpFilter);
  }

  /**
   * Deep Ocean Waves - LFO sweeping lowpass filter across brownian noise
   */
  createOceanWaves() {
    const buffer = this.createPinkNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    // LFO to create oceanic swell every ~8 seconds
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8.3 sec swell

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(450, this.ctx.currentTime); // Sweep between 200Hz - 800Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.gainNode);

    lfo.start(this.ctx.currentTime);
    noise.start(this.ctx.currentTime);

    this.nodes.push(noise, filter, lfo, lfoGain);
  }

  /**
   * Zen Harmonic Drone (432Hz root with soft 5th and octave)
   */
  createZenDrone() {
    const t = this.ctx.currentTime;
    const freqs = [108, 216, 324, 432]; // Harmonic series based on 432Hz

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      // Slight vibrato / chorusing LFO for spatial movement
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, t);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.18 / (idx + 1), t);

      osc.connect(oscGain);
      oscGain.connect(this.gainNode);

      osc.start(t);
      lfo.start(t);
      this.nodes.push(osc, lfo, lfoGain, oscGain);
    });
  }
}

export const binauralEngine = new BinauralSoundscapeEngine();


/**
 * ProceduralSounds.ts
 * MARS: 2187 — Complete procedural audio system using Web Audio API.
 * All sounds and music are synthesized mathematically — no external files.
 */

export type SoundId =
  | 'click'
  | 'confirm'
  | 'warning'
  | 'critical'
  | 'terminal_open'
  | 'terminal_close'
  | 'terminal_key'
  | 'reactor_hum'
  | 'airlock_open'
  | 'airlock_close'
  | 'rover_engine'
  | 'rover_brake'
  | 'wind_ambient'
  | 'storm_wind'
  | 'mechanical_ambient'
  | 'deep_resonance'
  | 'anomaly_pulse'
  | 'scan_ping'
  | 'objective_complete'
  | 'power_up'
  | 'power_down'
  | 'footstep'
  | 'suit_warning'
  | 'discovery';

type MusicTrack = 'menu' | 'landing' | 'aurelia' | 'helios' | 'final_choice' | 'ending_a' | 'ending_b';
type AmbientScene = 'interior' | 'exterior' | 'storm' | 'helios' | 'space';

interface PlayOptions {
  volume?: number;
  loop?: boolean;
  spatial?: boolean;
}

interface AmbientLoop {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

// ---------------------------------------------------------------------------
// Helper: fill a buffer with band-limited white noise
// ---------------------------------------------------------------------------
function fillNoise(data: Float32Array): void {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

// ---------------------------------------------------------------------------
// Helper: create a simple noise AudioBuffer
// ---------------------------------------------------------------------------
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  fillNoise(buffer.getChannelData(0));
  return buffer;
}

// ---------------------------------------------------------------------------
// Helper: create a looping noise source connected through a filter
// ---------------------------------------------------------------------------
function createFilteredNoise(
  ctx: AudioContext,
  dest: AudioNode,
  filterFreq: number,
  filterType: BiquadFilterType,
  gainValue: number,
  duration = 4
): [AudioBufferSourceNode, GainNode] {
  const buffer = createNoiseBuffer(ctx, duration);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = 1.2;

  const gain = ctx.createGain();
  gain.gain.value = gainValue;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  return [src, gain];
}

// ---------------------------------------------------------------------------
// Helper: linear ramp on a param
// ---------------------------------------------------------------------------
function rampParam(
  param: AudioParam,
  from: number,
  to: number,
  startTime: number,
  endTime: number
): void {
  param.setValueAtTime(from, startTime);
  param.linearRampToValueAtTime(to, endTime);
}

// ---------------------------------------------------------------------------
// Helper: exponential ramp (values must be > 0)
// ---------------------------------------------------------------------------
function expRamp(
  param: AudioParam,
  from: number,
  to: number,
  startTime: number,
  endTime: number
): void {
  param.setValueAtTime(Math.max(from, 0.0001), startTime);
  param.exponentialRampToValueAtTime(Math.max(to, 0.0001), endTime);
}

export class ProceduralSounds {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private activeNodes: Map<string, AudioNode[]> = new Map();
  private ambientLoops: Map<string, AmbientLoop> = new Map();

  // Active music oscillators so we can stop them
  private musicNodes: AudioNode[] = [];
  private musicFadeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Defer AudioContext creation until init()
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.masterGain);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  dispose(): void {
    this.stopAmbient();
    this.stopMusic(0);
    this.activeNodes.forEach((nodes) => {
      nodes.forEach((n) => {
        try {
          (n as AudioBufferSourceNode | OscillatorNode).stop?.();
        } catch (_) { /* already stopped */ }
        n.disconnect();
      });
    });
    this.activeNodes.clear();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  // -------------------------------------------------------------------------
  // Volume controls
  // -------------------------------------------------------------------------

  setMasterVolume(v: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  setMusicVolume(v: number): void {
    if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, v));
  }

  setSfxVolume(v: number): void {
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, v));
  }

  // -------------------------------------------------------------------------
  // Public play
  // -------------------------------------------------------------------------

  play(id: SoundId, options: PlayOptions = {}): void {
    if (!this.ctx || !this.sfxGain) return;
    const vol = options.volume ?? 1.0;
    try {
      this._dispatch(id, vol);
    } catch (e) {
      console.warn(`[ProceduralSounds] Error playing "${id}":`, e);
    }
  }

  // -------------------------------------------------------------------------
  // Loop control
  // -------------------------------------------------------------------------

  stopLoop(id: string): void {
    const nodes = this.activeNodes.get(id);
    if (nodes) {
      nodes.forEach((n) => {
        try { (n as AudioBufferSourceNode | OscillatorNode).stop?.(); } catch (_) { /* */ }
        n.disconnect();
      });
      this.activeNodes.delete(id);
    }
  }

  // -------------------------------------------------------------------------
  // Ambient scene control
  // -------------------------------------------------------------------------

  startAmbient(scene: AmbientScene): void {
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbient();

    switch (scene) {
      case 'interior':    this._ambientInterior(); break;
      case 'exterior':    this._ambientExterior(); break;
      case 'storm':       this._ambientStorm(); break;
      case 'helios':      this._ambientHelios(); break;
      case 'space':       this._ambientSpace(); break;
    }
  }

  stopAmbient(): void {
    this.ambientLoops.forEach(({ source, gain }) => {
      try { source.stop(); } catch (_) { /* */ }
      source.disconnect();
      gain.disconnect();
    });
    this.ambientLoops.clear();
  }

  // -------------------------------------------------------------------------
  // Music
  // -------------------------------------------------------------------------

  playMusic(track: MusicTrack): void {
    if (!this.ctx || !this.musicGain) return;
    this.stopMusic(0.5);
    setTimeout(() => {
      if (!this.ctx || !this.musicGain) return;
      switch (track) {
        case 'menu':         this._musicMenu(); break;
        case 'landing':      this._musicLanding(); break;
        case 'aurelia':      this._musicAurelia(); break;
        case 'helios':       this._musicHelios(); break;
        case 'final_choice': this._musicFinalChoice(); break;
        case 'ending_a':     this._musicEndingA(); break;
        case 'ending_b':     this._musicEndingB(); break;
      }
    }, 600);
  }

  stopMusic(fadeTime = 1.5): void {
    if (!this.ctx) return;
    if (this.musicFadeTimer !== null) {
      clearTimeout(this.musicFadeTimer);
      this.musicFadeTimer = null;
    }
    const now = this.ctx.currentTime;
    if (this.musicGain) {
      const currentVol = this.musicGain.gain.value;
      if (fadeTime > 0) {
        this.musicGain.gain.setValueAtTime(currentVol, now);
        this.musicGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      } else {
        this.musicGain.gain.setValueAtTime(0, now);
      }
    }
    const nodesToStop = [...this.musicNodes];
    this.musicNodes = [];
    const stopDelay = Math.max(fadeTime, 0) * 1000 + 50;
    this.musicFadeTimer = setTimeout(() => {
      nodesToStop.forEach((n) => {
        try { (n as OscillatorNode | AudioBufferSourceNode).stop?.(); } catch (_) { /* */ }
        n.disconnect();
      });
      if (this.musicGain) this.musicGain.gain.setValueAtTime(0.5, 0);
      this.musicFadeTimer = null;
    }, stopDelay);
  }

  // =========================================================================
  // SOUND IMPLEMENTATIONS
  // =========================================================================

  private _dispatch(id: SoundId, vol: number): void {
    switch (id) {
      case 'click':             this._click(vol); break;
      case 'confirm':           this._confirm(vol); break;
      case 'warning':           this._warning(vol); break;
      case 'critical':          this._critical(vol); break;
      case 'terminal_open':     this._terminalOpen(vol); break;
      case 'terminal_close':    this._terminalClose(vol); break;
      case 'terminal_key':      this._terminalKey(vol); break;
      case 'reactor_hum':       this._reactorHum(vol); break;
      case 'airlock_open':      this._airlockOpen(vol); break;
      case 'airlock_close':     this._airlockClose(vol); break;
      case 'rover_engine':      this._roverEngine(vol); break;
      case 'rover_brake':       this._roverBrake(vol); break;
      case 'wind_ambient':      this._windAmbient(vol); break;
      case 'storm_wind':        this._stormWind(vol); break;
      case 'mechanical_ambient':this._mechanicalAmbient(vol); break;
      case 'deep_resonance':    this._deepResonance(vol); break;
      case 'anomaly_pulse':     this._anomalyPulse(vol); break;
      case 'scan_ping':         this._scanPing(vol); break;
      case 'objective_complete':this._objectiveComplete(vol); break;
      case 'power_up':          this._powerUp(vol); break;
      case 'power_down':        this._powerDown(vol); break;
      case 'footstep':          this._footstep(vol); break;
      case 'suit_warning':      this._suitWarning(vol); break;
      case 'discovery':         this._discovery(vol); break;
    }
  }

  // -------------------------------------------------------------------------
  // Helpers for creating basic building blocks
  // -------------------------------------------------------------------------

  private _osc(
    type: OscillatorType,
    freq: number,
    dest: AudioNode,
    gainVal: number,
    startTime: number,
    stopTime: number
  ): OscillatorNode {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.value = gainVal;

    osc.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(stopTime);
    return osc;
  }

  private _makeEnvGain(
    dest: AudioNode,
    attackTime: number,
    peakGain: number,
    decayTime: number,
    sustainGain: number,
    releaseStart: number,
    releaseEnd: number,
    startTime: number
  ): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
    g.gain.linearRampToValueAtTime(sustainGain, startTime + attackTime + decayTime);
    g.gain.setValueAtTime(sustainGain, startTime + releaseStart);
    g.gain.linearRampToValueAtTime(0, startTime + releaseEnd);
    g.connect(dest);
    return g;
  }

  // =========================================================================
  // SFX — Individual Implementations
  // =========================================================================

  /** click: short 800hz sine, 30ms */
  private _click(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.6, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  /** confirm: two-tone ascending 440->880hz */
  private _confirm(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const playTone = (freq: number, startT: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.5, startT);
      g.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
      osc.connect(g);
      g.connect(dest);
      osc.start(startT);
      osc.stop(startT + dur + 0.01);
    };

    playTone(440, now, 0.12);
    playTone(880, now + 0.13, 0.18);
  }

  /** warning: pulsing 320hz square wave */
  private _warning(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const pulse = (startT: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 320;

      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.3, startT);
      g.gain.setValueAtTime(0, startT + 0.15);

      osc.connect(g);
      g.connect(dest);
      osc.start(startT);
      osc.stop(startT + 0.16);
    };

    for (let i = 0; i < 4; i++) {
      pulse(now + i * 0.28);
    }
  }

  /** critical: urgent repeating 500hz with vibrato */
  private _critical(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const count = 5;
    for (let i = 0; i < count; i++) {
      const startT = now + i * 0.18;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 500;

      // Vibrato LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 18;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 25;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.35, startT);
      g.gain.exponentialRampToValueAtTime(0.001, startT + 0.14);

      osc.connect(g);
      g.connect(dest);

      osc.start(startT);
      osc.stop(startT + 0.15);
      lfo.start(startT);
      lfo.stop(startT + 0.15);
    }
  }

  /** terminal_open: electronic ascending sweep */
  private _terminalOpen(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 0.35;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + dur);
    filter.Q.value = 3;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.4, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.05);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.1);
  }

  /** terminal_close: descending sweep */
  private _terminalClose(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 0.3;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + dur);
    filter.Q.value = 3;

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  /** terminal_key: very short 1200hz tick */
  private _terminalKey(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1200;

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.15, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  /** reactor_hum: 60hz + harmonics looping drone */
  private _reactorHum(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 3.0;

    const harmonics: [number, number][] = [
      [60, 0.6],
      [120, 0.3],
      [180, 0.15],
      [240, 0.08],
    ];

    harmonics.forEach(([freq, amp]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      g.gain.value = vol * amp;

      osc.connect(g);
      g.connect(dest);
      osc.start(now);
      osc.stop(now + dur);
    });
  }

  /** airlock_open: mechanical whoosh + pressure release */
  private _airlockOpen(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    // Mechanical thud
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(80, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    const thudG = ctx.createGain();
    thudG.gain.setValueAtTime(vol * 0.7, now);
    thudG.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    thud.connect(thudG);
    thudG.connect(dest);
    thud.start(now);
    thud.stop(now + 0.3);

    // Pressure whoosh
    const noiseBuf = createNoiseBuffer(ctx, 1.5);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.6);
    filter.Q.value = 0.8;

    const whooshG = ctx.createGain();
    whooshG.gain.setValueAtTime(0, now);
    whooshG.gain.linearRampToValueAtTime(vol * 0.5, now + 0.15);
    whooshG.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    src.connect(filter);
    filter.connect(whooshG);
    whooshG.connect(dest);
    src.start(now + 0.1);
    src.stop(now + 1.4);
  }

  /** airlock_close: reverse — whoosh then thud */
  private _airlockClose(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    // Whoosh falling
    const noiseBuf = createNoiseBuffer(ctx, 1.2);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.7);
    filter.Q.value = 0.8;

    const whooshG = ctx.createGain();
    whooshG.gain.setValueAtTime(vol * 0.5, now);
    whooshG.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    src.connect(filter);
    filter.connect(whooshG);
    whooshG.connect(dest);
    src.start(now);
    src.stop(now + 1.0);

    // Final thud
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(100, now + 0.8);
    thud.frequency.exponentialRampToValueAtTime(40, now + 1.0);
    const thudG = ctx.createGain();
    thudG.gain.setValueAtTime(vol * 0.8, now + 0.8);
    thudG.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    thud.connect(thudG);
    thudG.connect(dest);
    thud.start(now + 0.8);
    thud.stop(now + 1.15);
  }

  /** rover_engine: 80hz rumble with harmonics */
  private _roverEngine(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 2.0;

    [[80, 0.5], [160, 0.2], [240, 0.1], [320, 0.05]].forEach(([freq, amp]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      // Slight flutter
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.04, now + 0.5);
      osc.frequency.linearRampToValueAtTime(freq, now + 1.0);
      osc.frequency.linearRampToValueAtTime(freq * 0.97, now + 1.5);
      osc.frequency.linearRampToValueAtTime(freq, now + 2.0);

      const g = ctx.createGain();
      g.gain.value = vol * amp;
      osc.connect(g);
      g.connect(dest);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    });
  }

  /** rover_brake: high friction screech */
  private _roverBrake(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const noiseBuf = createNoiseBuffer(ctx, 0.8);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = 3200;
    filter.gain.value = 18;
    filter.Q.value = 8;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 1200;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.6, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    src.connect(filter);
    filter.connect(filter2);
    filter2.connect(g);
    g.connect(dest);
    src.start(now);
    src.stop(now + 0.7);
  }

  /** wind_ambient: filtered noise */
  private _windAmbient(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 4.0;

    const [src, g] = createFilteredNoise(ctx, dest, 600, 'bandpass', vol * 0.3, dur);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.3, now + 0.5);
    g.gain.linearRampToValueAtTime(vol * 0.2, now + 2.0);
    g.gain.linearRampToValueAtTime(vol * 0.3, now + 3.5);
    g.gain.linearRampToValueAtTime(0, now + dur);
    src.start(now);
    src.stop(now + dur + 0.05);
  }

  /** storm_wind: intense filtered noise with LFO */
  private _stormWind(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 5.0;

    const noiseBuf = createNoiseBuffer(ctx, dur);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    // LFO for wind gusts
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.7, now + 0.8);
    g.gain.linearRampToValueAtTime(vol * 0.4, now + 2.5);
    g.gain.linearRampToValueAtTime(vol * 0.8, now + 3.5);
    g.gain.linearRampToValueAtTime(0, now + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    lfo.start(now);
    lfo.stop(now + dur + 0.1);
    src.start(now);
    src.stop(now + dur + 0.1);
  }

  /** mechanical_ambient: slow rhythmic clanks + hum */
  private _mechanicalAmbient(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    // Base hum
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 55;
    const humG = ctx.createGain();
    humG.gain.value = vol * 0.2;
    hum.connect(humG);
    humG.connect(dest);
    hum.start(now);
    hum.stop(now + 5.0);

    // Clanks
    const clankTimes = [0.5, 1.3, 2.2, 3.1, 4.0];
    clankTimes.forEach((t) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, now + t);
      osc.frequency.exponentialRampToValueAtTime(80, now + t + 0.1);

      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.4, now + t);
      g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.25);

      osc.connect(g);
      g.connect(dest);
      osc.start(now + t);
      osc.stop(now + t + 0.3);
    });
  }

  /** deep_resonance: 40hz sine with long reverb-like tail */
  private _deepResonance(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const freqs = [40, 80, 120];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * (0.6 / (i + 1)), now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, now + 3.0 + i * 0.5);

      osc.connect(g);
      g.connect(dest);
      osc.start(now);
      osc.stop(now + 4.5);
    });
  }

  /** anomaly_pulse: strange harmonic series */
  private _anomalyPulse(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    // Inharmonic series
    const ratios = [1, 1.17, 1.51, 2.03, 2.47, 3.14];
    const base = 110;

    ratios.forEach((r, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * r;

      const g = ctx.createGain();
      const delay = i * 0.08;
      g.gain.setValueAtTime(0, now + delay);
      g.gain.linearRampToValueAtTime(vol * (0.3 / (i * 0.5 + 1)), now + delay + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.5);

      osc.connect(g);
      g.connect(dest);
      osc.start(now + delay);
      osc.stop(now + delay + 1.6);
    });
  }

  /** scan_ping: sonar-like ping */
  private _scanPing(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.6);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Echo
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.3;
    const echoGain = ctx.createGain();
    echoGain.gain.value = 0.25;

    osc.connect(g);
    g.connect(dest);
    g.connect(delay);
    delay.connect(echoGain);
    echoGain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  /** objective_complete: triumphant chord */
  private _objectiveComplete(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    // Major chord: C4, E4, G4, C5
    const freqs = [261.63, 329.63, 392.0, 523.25];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.06);
      g.gain.linearRampToValueAtTime(vol * 0.3, now + i * 0.06 + 0.05);
      g.gain.setValueAtTime(vol * 0.3, now + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(g);
      g.connect(dest);
      osc.start(now + i * 0.06);
      osc.stop(now + 2.0);
    });
  }

  /** power_up: rising electrical surge */
  private _powerUp(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 1.2;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(8000, now + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.5, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.1);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.15);
  }

  /** power_down: falling electrical drain */
  private _powerDown(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;
    const dur = 1.5;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(6000, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.45, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  /** footstep: brief low thud */
  private _footstep(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    const noiseBuf = createNoiseBuffer(ctx, 0.1);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 300;
    const noiseG = ctx.createGain();
    noiseG.gain.setValueAtTime(vol * 0.3, now);
    noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.6, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(g);
    g.connect(dest);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseG);
    noiseG.connect(dest);

    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  /** suit_warning: suit beep sequence */
  private _suitWarning(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    const pattern = [0, 0.22, 0.44, 0.88];
    pattern.forEach((t) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 1047; // C6

      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.25, now + t);
      g.gain.setValueAtTime(0, now + t + 0.15);

      osc.connect(g);
      g.connect(dest);
      osc.start(now + t);
      osc.stop(now + t + 0.17);
    });
  }

  /** discovery: wonder chord */
  private _discovery(vol: number): void {
    const ctx = this.ctx!;
    const dest = this.sfxGain!;
    const now = ctx.currentTime;

    // Lydian-flavored: F, A, B, E (wonder chord)
    const freqs = [174.61, 220.0, 246.94, 329.63, 440.0, 659.25];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      const t0 = now + i * 0.05;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol * 0.25, t0 + 0.08);
      g.gain.setValueAtTime(vol * 0.25, now + 1.0);
      g.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(g);
      g.connect(dest);
      osc.start(t0);
      osc.stop(now + 3.2);
    });
  }

  // =========================================================================
  // AMBIENT IMPLEMENTATIONS
  // =========================================================================

  private _ambientInterior(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dest = this.masterGain;
    const dur = 8;

    // Low electrical hum
    const humBuf = this._synthesizeHum(ctx, dur, 60, [1, 0.5, 0.25, 0.1]);
    const humSrc = ctx.createBufferSource();
    humSrc.buffer = humBuf;
    humSrc.loop = true;
    const humG = ctx.createGain();
    humG.gain.value = 0.12;
    humSrc.connect(humG);
    humG.connect(dest);
    humSrc.start();
    this.ambientLoops.set('interior_hum', { source: humSrc, gain: humG });

    // Subtle air circulation noise
    const [airSrc, airG] = createFilteredNoise(ctx, dest, 400, 'bandpass', 0.04, dur);
    airSrc.loop = true;
    airSrc.start();
    this.ambientLoops.set('interior_air', { source: airSrc, gain: airG });
  }

  private _ambientExterior(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dest = this.masterGain;
    const dur = 6;

    const [windSrc, windG] = createFilteredNoise(ctx, dest, 500, 'bandpass', 0.08, dur);
    windSrc.loop = true;
    windSrc.start();
    this.ambientLoops.set('exterior_wind', { source: windSrc, gain: windG });

    // LFO to gust
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.06;
    lfo.connect(lfoG);
    lfoG.connect(windG.gain);
    lfo.start();
  }

  private _ambientStorm(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dest = this.masterGain;
    const dur = 8;

    // Heavy wind
    const [stormSrc, stormG] = createFilteredNoise(ctx, dest, 700, 'bandpass', 0.25, dur);
    stormSrc.loop = true;
    stormSrc.start();
    this.ambientLoops.set('storm_main', { source: stormSrc, gain: stormG });

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.35;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.15;
    lfo.connect(lfoG);
    lfoG.connect(stormG.gain);
    lfo.start();

    // Sub rumble
    const [subSrc, subG] = createFilteredNoise(ctx, dest, 80, 'lowpass', 0.15, dur);
    subSrc.loop = true;
    subSrc.start();
    this.ambientLoops.set('storm_sub', { source: subSrc, gain: subG });
  }

  private _ambientHelios(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dest = this.masterGain;
    const dur = 10;

    // Alien resonance: inharmonic tones
    const heliosBuf = this._synthesizeAlienDrone(ctx, dur);
    const src = ctx.createBufferSource();
    src.buffer = heliosBuf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0.18;
    src.connect(g);
    g.connect(dest);
    src.start();
    this.ambientLoops.set('helios_drone', { source: src, gain: g });
  }

  private _ambientSpace(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dest = this.masterGain;
    const dur = 12;

    // Very subtle hiss
    const [hissSrc, hissG] = createFilteredNoise(ctx, dest, 2000, 'highpass', 0.015, dur);
    hissSrc.loop = true;
    hissSrc.start();
    this.ambientLoops.set('space_hiss', { source: hissSrc, gain: hissG });

    // Deep sub hum
    const subBuf = this._synthesizeHum(ctx, dur, 30, [1, 0.3]);
    const subSrc = ctx.createBufferSource();
    subSrc.buffer = subBuf;
    subSrc.loop = true;
    const subG = ctx.createGain();
    subG.gain.value = 0.08;
    subSrc.connect(subG);
    subG.connect(dest);
    subSrc.start();
    this.ambientLoops.set('space_sub', { source: subSrc, gain: subG });
  }

  // =========================================================================
  // BUFFER SYNTHESIS HELPERS
  // =========================================================================

  /** Synthesize a loopable hum buffer with harmonics */
  private _synthesizeHum(
    ctx: AudioContext,
    duration: number,
    fundamental: number,
    amplitudes: number[]
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    const twoPi = 2 * Math.PI;

    for (let i = 0; i < frameCount; i++) {
      let sample = 0;
      const t = i / sampleRate;
      amplitudes.forEach((amp, hi) => {
        const freq = fundamental * (hi + 1);
        sample += amp * Math.sin(twoPi * freq * t);
      });
      data[i] = sample * 0.3;
    }
    return buffer;
  }

  /** Synthesize an alien drone with inharmonic series */
  private _synthesizeAlienDrone(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    const twoPi = 2 * Math.PI;
    const ratios = [1, 1.23, 1.57, 2.11, 3.17];
    const base = 55;
    const ampList = [0.5, 0.25, 0.15, 0.08, 0.04];

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let sample = 0;
      ratios.forEach((r, idx) => {
        // Slow beating between slight detuning
        const freq = base * r + Math.sin(twoPi * 0.07 * t) * (r * 0.5);
        sample += ampList[idx] * Math.sin(twoPi * freq * t);
      });
      data[i] = sample * 0.4;
    }
    return buffer;
  }

  /** Synthesize a rendered audio buffer for a chord pad over `duration` seconds */
  private _synthesizePad(
    ctx: AudioContext,
    duration: number,
    freqs: number[],
    amplitudes: number[],
    attackSecs: number,
    releaseSecs: number,
    addNoise: boolean
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    const twoPi = 2 * Math.PI;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      // Envelope
      let env = 1.0;
      if (t < attackSecs) {
        env = t / attackSecs;
      } else if (t > duration - releaseSecs) {
        env = (duration - t) / releaseSecs;
      }

      let sample = 0;
      freqs.forEach((freq, fi) => {
        // Slight chorus detuning per voice
        const detune = 1 + (fi % 2 === 0 ? 0.003 : -0.003);
        sample += amplitudes[fi] * Math.sin(twoPi * freq * detune * t);
        // Add second harmonic at lower volume for richness
        sample += amplitudes[fi] * 0.15 * Math.sin(twoPi * freq * 2 * t);
      });

      if (addNoise) {
        sample += (Math.random() * 2 - 1) * 0.008;
      }

      data[i] = sample * env * 0.35;
    }
    return buffer;
  }

  // =========================================================================
  // MUSIC TRACK IMPLEMENTATIONS
  // =========================================================================

  /**
   * Schedule a looping music pad buffer.
   * The buffer will be played repeatedly via OscillatorNode-driven patterns
   * or pre-rendered AudioBuffer loops connected to musicGain.
   */
  private _scheduleLoop(buffer: AudioBuffer, gainVal: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const g = ctx.createGain();
    g.gain.value = gainVal;
    src.connect(g);
    g.connect(this.musicGain!);
    src.start();

    this.musicNodes.push(src, g);
    return src;
  }

  /** menu: slow pad with 3-4 note chord loop, 8 second period */
  private _musicMenu(): void {
    const ctx = this.ctx!;
    // Am7 chord: A2, C3, E3, G3
    const freqs = [110, 130.81, 164.81, 196.0];
    const amps  = [0.6,  0.5,   0.45,  0.4];
    const buf = this._synthesizePad(ctx, 8, freqs, amps, 1.5, 1.5, true);
    this._scheduleLoop(buf, 0.7);
  }

  /** landing: deep drone, single tone, occasional harmonics */
  private _musicLanding(): void {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 12;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    const twoPi = 2 * Math.PI;
    const base = 55; // A1

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const env = t < 2 ? t / 2 : t > duration - 2 ? (duration - t) / 2 : 1;
      let s = 0.6 * Math.sin(twoPi * base * t);
      s += 0.15 * Math.sin(twoPi * base * 2 * t);
      // Occasional harmonic pulse (every ~4 seconds)
      const phase = (t % 4) / 4;
      if (phase < 0.05) {
        s += 0.2 * Math.sin(twoPi * base * 3 * t) * (1 - phase / 0.05);
      }
      data[i] = s * env * 0.3;
    }

    this._scheduleLoop(buffer, 0.65);
  }

  /** aurelia: sparse notes, 12-second period, minor key feel */
  private _musicAurelia(): void {
    const ctx = this.ctx!;
    // D minor: D3, F3, A3, C4 — sparse
    const freqs = [146.83, 174.61, 220.0, 261.63];
    const amps  = [0.55,   0.45,   0.4,   0.35];
    const buf = this._synthesizePad(ctx, 12, freqs, amps, 2.5, 2.5, true);
    this._scheduleLoop(buf, 0.6);
  }

  /** helios: low frequency harmonics, 2-3 tones, alien feel */
  private _musicHelios(): void {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 16;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    const twoPi = 2 * Math.PI;

    // Alien inharmonic tones
    const tones = [
      { freq: 45, amp: 0.5 },
      { freq: 67, amp: 0.3 },
      { freq: 113, amp: 0.2 },
    ];

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const env = t < 3 ? t / 3 : t > duration - 3 ? (duration - t) / 3 : 1;
      let s = 0;
      tones.forEach(({ freq, amp }) => {
        // Slight waver
        const fWaver = freq * (1 + 0.008 * Math.sin(twoPi * 0.05 * t));
        s += amp * Math.sin(twoPi * fWaver * t);
      });
      data[i] = s * env * 0.35;
    }

    this._scheduleLoop(buffer, 0.7);
  }

  /** final_choice: slowly rising chord sequence */
  private _musicFinalChoice(): void {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 20;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    const twoPi = 2 * Math.PI;

    // Four chords spaced 5s apart, rising
    const chords: [number[], number][] = [
      [[130.81, 164.81, 196.0], 0],    // C minor
      [[146.83, 174.61, 220.0], 5],    // D minor
      [[164.81, 207.65, 261.63], 10],  // E minor
      [[196.0,  246.94, 311.13], 15],  // G minor
    ];

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let s = 0;
      chords.forEach(([freqs, startT]) => {
        const localT = t - startT;
        if (localT < 0 || localT > 6) return;
        const env = localT < 1 ? localT : localT > 5 ? 6 - localT : 1;
        freqs.forEach((freq) => {
          s += 0.2 * env * Math.sin(twoPi * freq * t);
        });
      });
      data[i] = s * 0.35;
    }

    this._scheduleLoop(buffer, 0.75);
  }

  /** ending_a: resolution chord (major) */
  private _musicEndingA(): void {
    const ctx = this.ctx!;
    // C major: C3, E3, G3, C4
    const freqs = [130.81, 164.81, 196.0, 261.63];
    const amps  = [0.55,   0.5,    0.45,  0.4];
    const buf = this._synthesizePad(ctx, 10, freqs, amps, 2.0, 3.0, false);
    this._scheduleLoop(buf, 0.7);
  }

  /** ending_b: triumphant pad (major + octave) */
  private _musicEndingB(): void {
    const ctx = this.ctx!;
    // G major with high octave: G2, B2, D3, G3, B3, D4
    const freqs = [98.0, 123.47, 146.83, 196.0, 246.94, 293.66];
    const amps  = [0.5,  0.4,    0.4,    0.45,  0.35,   0.3];
    const buf = this._synthesizePad(ctx, 12, freqs, amps, 1.5, 2.5, false);
    this._scheduleLoop(buf, 0.75);
  }
}

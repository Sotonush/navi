const KEY = "navi.sound";

class Sound {
  private ctx?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private lastCrackle = 0;
  enabled = false;

  enable(): void {
    if (!this.ctx) this.build();
    void this.ctx!.resume();
    this.master!.gain.cancelScheduledValues(this.ctx!.currentTime);
    this.master!.gain.linearRampToValueAtTime(0.5, this.ctx!.currentTime + 1.2);
    this.enabled = true;
    remember(true);
  }

  disable(): void {
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    }
    this.enabled = false;
    remember(false);
  }

  toggle(): boolean {
    if (this.enabled) this.disable();
    else this.enable();
    return this.enabled;
  }

  wanted(): boolean {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  }

  staticBurst(duration = 0.28, level = 0.35): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise!;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(ctx.currentTime, Math.random() * 1.5, duration);
  }

  crackle(): void {
    const now = performance.now();
    if (!this.ready() || now - this.lastCrackle < 90) return;
    this.lastCrackle = now;
    this.staticBurst(0.05 + Math.random() * 0.06, 0.25);
  }

  blip(frequency = 880, duration = 0.05, level = 0.08): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(this.master!);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  ping(): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(this.master!);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  descend(): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 1.6);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start();
    osc.stop(ctx.currentTime + 1.8);
    this.staticBurst(0.6, 0.3);
  }

  private ready(): boolean {
    return this.enabled && !!this.ctx && !!this.master;
  }

  private build(): void {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const length = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const hum = ctx.createGain();
    hum.gain.value = 0.09;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 220;
    lowpass.connect(hum).connect(this.master);
    for (const [frequency, type] of [[50, "sawtooth"], [100, "sine"], [150.4, "sine"]] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      osc.connect(lowpass);
      osc.start();
    }

    const buzz = ctx.createBufferSource();
    buzz.buffer = this.noise;
    buzz.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 2400;
    band.Q.value = 6;
    const buzzGain = ctx.createGain();
    buzzGain.gain.value = 0.012;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain).connect(buzzGain.gain);
    buzz.connect(band).connect(buzzGain).connect(this.master);
    buzz.start();
    lfo.start();
  }
}

function remember(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    return;
  }
}

export const sound = new Sound();

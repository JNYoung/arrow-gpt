type SoundName = 'move' | 'blocked' | 'win' | 'lose' | 'tap';

const FREQUENCIES: Record<SoundName, [number, number]> = {
  tap: [360, 0.04],
  move: [560, 0.08],
  blocked: [150, 0.12],
  win: [720, 0.16],
  lose: [110, 0.22]
};

export class GameAudio {
  private context?: AudioContext;
  private musicGain?: GainNode;
  private musicOscillators: OscillatorNode[] = [];

  constructor(
    private musicEnabled: boolean,
    private effectsEnabled: boolean
  ) {}

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setEffectsEnabled(enabled: boolean): void {
    this.effectsEnabled = enabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isEffectsEnabled(): boolean {
    return this.effectsEnabled;
  }

  startMusic(): void {
    if (!this.musicEnabled || this.musicGain) {
      return;
    }

    const context = this.getContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      void context.resume();
    }

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028, now + 0.5);
    gain.connect(context.destination);

    const notes = [196, 246.94, 329.63];
    this.musicOscillators = notes.map((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index * 3 - 3, now);
      oscillator.connect(gain);
      oscillator.start(now);
      return oscillator;
    });
    this.musicGain = gain;
  }

  stopMusic(): void {
    const context = this.context;
    const gain = this.musicGain;
    if (!context || !gain) {
      return;
    }

    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    for (const oscillator of this.musicOscillators) {
      oscillator.stop(now + 0.22);
    }
    window.setTimeout(() => {
      gain.disconnect();
    }, 260);
    this.musicGain = undefined;
    this.musicOscillators = [];
  }

  play(name: SoundName): void {
    if (!this.effectsEnabled) {
      return;
    }

    const context = this.getContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      void context.resume();
    }

    const [frequency, duration] = FREQUENCIES[name];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = name === 'blocked' || name === 'lose' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private getContext(): AudioContext | undefined {
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) {
      return undefined;
    }

    this.context ??= new AudioCtor();
    return this.context;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

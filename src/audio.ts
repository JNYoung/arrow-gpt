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

  constructor(private enabled: boolean) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  play(name: SoundName): void {
    if (!this.enabled) {
      return;
    }

    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    this.context ??= new AudioCtor();
    const [frequency, duration] = FREQUENCIES[name];
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    oscillator.type = name === 'blocked' || name === 'lose' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

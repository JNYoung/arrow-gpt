interface FBInstantLike {
  initializeAsync: () => Promise<void>;
  startGameAsync: () => Promise<void>;
  setLoadingProgress: (progress: number) => void;
  player?: {
    getName: () => string;
  };
  context?: {
    chooseAsync?: () => Promise<void>;
  };
  shareAsync?: (payload: {
    intent: 'SHARE' | 'INVITE';
    image?: string;
    text: string;
    data?: Record<string, unknown>;
  }) => Promise<void>;
}

declare global {
  interface Window {
    FBInstant?: FBInstantLike;
  }
}

export interface PlatformBridge {
  name: 'web' | 'meta';
  playerName?: string;
  ready: () => Promise<void>;
  progress: (value: number) => void;
  haptic: (pattern?: number | number[]) => void;
  share: (text: string) => Promise<void>;
}

export function createPlatformBridge(): PlatformBridge {
  const fb = window.FBInstant;

  if (!fb) {
    return {
      name: 'web',
      ready: async () => undefined,
      progress: () => undefined,
      haptic: (pattern = 24) => {
        window.navigator.vibrate?.(pattern);
      },
      share: async (text: string) => {
        if (navigator.share) {
          await navigator.share({ title: 'Arrow Again', text });
        }
      }
    };
  }

  return {
    name: 'meta',
    playerName: fb.player?.getName(),
    ready: async () => {
      await fb.initializeAsync();
      fb.setLoadingProgress(90);
      await fb.startGameAsync();
    },
    progress: (value: number) => fb.setLoadingProgress(value),
    haptic: (pattern = 24) => {
      window.navigator.vibrate?.(pattern);
    },
    share: async (text: string) => {
      await fb.shareAsync?.({
        intent: 'SHARE',
        text,
        data: { source: 'arrow-again' }
      });
    }
  };
}

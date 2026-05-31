export type PlatformTarget = 'web' | 'meta-instant' | 'google-play' | 'ios-app-store';

export type RewardedPlacement = 'hint' | 'revive' | 'double-reward';

export type RenderQuality = 'high' | 'balanced' | 'low';

export type SharePayload = {
  title?: string;
  text: string;
  image?: string;
  data?: Record<string, unknown>;
};

export type PlatformEventPayload = Record<string, string | number | boolean>;

export type PlatformCapabilities = {
  nativeShell: boolean;
  instantGame: boolean;
  rewardedAd: boolean;
  share: boolean;
  haptic: boolean;
  player: boolean;
  analytics: boolean;
};

export type PlatformRuntimeConfig = {
  mockRewardedAds?: boolean;
  rewardedPlacements?: Partial<Record<RewardedPlacement, string>>;
  renderQuality?: RenderQuality;
};

export interface PlatformBridge {
  name: PlatformTarget;
  playerName?: string;
  renderQuality: RenderQuality;
  capabilities: PlatformCapabilities;
  ready: () => Promise<void>;
  progress: (value: number) => void;
  haptic: (pattern?: number | number[]) => void;
  showRewardedAd: (placement: RewardedPlacement) => Promise<boolean>;
  share: (payload: string | SharePayload) => Promise<void>;
  track: (event: string, payload?: PlatformEventPayload) => void;
}

declare global {
  interface Window {
    __GAME_PLATFORM_CONFIG__?: PlatformRuntimeConfig;
  }
}

export const defaultCapabilities: PlatformCapabilities = {
  nativeShell: false,
  instantGame: false,
  rewardedAd: false,
  share: false,
  haptic: false,
  player: false,
  analytics: false
};

const mockRewardDelay = 180;

export function normalizeRenderQuality(value: unknown, fallback: RenderQuality = 'balanced'): RenderQuality {
  return value === 'high' || value === 'balanced' || value === 'low' ? value : fallback;
}

export function resolveConfiguredRenderQuality(fallback: RenderQuality = 'balanced'): RenderQuality {
  return normalizeRenderQuality(window.__GAME_PLATFORM_CONFIG__?.renderQuality, fallback);
}

export async function resolveMockReward(): Promise<boolean> {
  await new Promise((resolve) => window.setTimeout(resolve, mockRewardDelay));
  return true;
}

export function normalizeSharePayload(payload: string | SharePayload): SharePayload {
  if (typeof payload === 'string') {
    return {
      title: 'Arrow Again',
      text: payload
    };
  }

  return payload;
}

export function vibrate(pattern: number | number[] = 24): void {
  window.navigator.vibrate?.(pattern);
}

export async function shareOnWeb(payload: string | SharePayload): Promise<void> {
  const normalized = normalizeSharePayload(payload);
  if (navigator.share) {
    await navigator.share({
      title: normalized.title ?? 'Arrow Again',
      text: normalized.text
    });
  }
}

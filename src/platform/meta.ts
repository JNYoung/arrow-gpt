import {
  defaultCapabilities,
  normalizeSharePayload,
  resolveConfiguredRenderQuality,
  resolveMockReward,
  vibrate,
  type PlatformBridge,
  type PlatformEventPayload,
  type RewardedPlacement
} from './spec';
import { isGoogleAnalyticsConfigured, trackGoogleAnalytics } from '../analytics';

interface FBInstantLike {
  initializeAsync: () => Promise<void>;
  startGameAsync: () => Promise<void>;
  setLoadingProgress: (progress: number) => void;
  getRewardedVideoAsync?: (placementId: string) => Promise<{
    loadAsync: () => Promise<void>;
    showAsync: () => Promise<void>;
  }>;
  logEvent?: (eventName: string, valueToSum?: number, parameters?: Record<string, string | number>) => void;
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

export function createMetaPlatformBridge(): PlatformBridge | undefined {
  const fb = window.FBInstant;

  if (!fb) {
    return undefined;
  }

  const placements = window.__GAME_PLATFORM_CONFIG__?.rewardedPlacements ?? {};
  const mockRewardedAds = Boolean(window.__GAME_PLATFORM_CONFIG__?.mockRewardedAds);

  return {
    name: 'meta-instant',
    playerName: fb.player?.getName(),
    renderQuality: resolveConfiguredRenderQuality('balanced'),
    capabilities: {
      ...defaultCapabilities,
      instantGame: true,
      rewardedAd: Boolean(fb.getRewardedVideoAsync && hasRewardedPlacement(placements)) || mockRewardedAds,
      share: Boolean(fb.shareAsync),
      haptic: Boolean(navigator.vibrate),
      player: Boolean(fb.player),
      analytics: Boolean(fb.logEvent) || isGoogleAnalyticsConfigured()
    },
    ready: async () => {
      await fb.initializeAsync();
      fb.setLoadingProgress(90);
      await fb.startGameAsync();
    },
    progress: (value: number) => fb.setLoadingProgress(value),
    haptic: vibrate,
    showRewardedAd: async (placement) => showMetaRewardedAd(fb, placement, placements, mockRewardedAds),
    share: async (payload) => {
      const normalized = normalizeSharePayload(payload);
      await fb.shareAsync?.({
        intent: 'SHARE',
        image: normalized.image,
        text: normalized.text,
        data: { source: 'arrow-again', ...normalized.data }
      });
    },
    track: (event, payload) => {
      fb.logEvent?.(event, undefined, serializeEventPayload(payload));
      if (!fb.logEvent) {
        trackGoogleAnalytics(event, payload);
      }
    }
  };
}

function hasRewardedPlacement(placements: Partial<Record<RewardedPlacement, string>>): boolean {
  return Boolean(placements.hint || placements.revive || placements['double-reward']);
}

async function showMetaRewardedAd(
  fb: FBInstantLike,
  placement: RewardedPlacement,
  placements: Partial<Record<RewardedPlacement, string>>,
  mockRewardedAds: boolean
): Promise<boolean> {
  const placementId = placements[placement];

  if (!fb.getRewardedVideoAsync || !placementId) {
    return mockRewardedAds ? resolveMockReward() : false;
  }

  try {
    const ad = await fb.getRewardedVideoAsync(placementId);
    await ad.loadAsync();
    await ad.showAsync();
    return true;
  } catch {
    return false;
  }
}

function serializeEventPayload(payload?: PlatformEventPayload): Record<string, string | number> | undefined {
  if (!payload) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value])
  );
}

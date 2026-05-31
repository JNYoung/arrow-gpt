import {
  defaultCapabilities,
  normalizeRenderQuality,
  resolveMockReward,
  resolveConfiguredRenderQuality,
  shareOnWeb,
  vibrate,
  type PlatformBridge,
  type PlatformEventPayload,
  type RenderQuality,
  type RewardedPlacement
} from './spec';

type NativeGameHost = {
  renderQuality?: RenderQuality;
  getRenderQuality?: () => RenderQuality;
  showRewardedAd?: (placement: RewardedPlacement) => Promise<boolean>;
  track?: (event: string, payload?: PlatformEventPayload) => void;
};

type CapacitorGlobal = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
};

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
    NativeGameHost?: NativeGameHost;
  }
}

export function createGooglePlatformBridge(): PlatformBridge | undefined {
  const platform = window.Capacitor?.getPlatform?.();
  const isNativeAndroid = window.Capacitor?.isNativePlatform?.() && platform === 'android';

  if (!isNativeAndroid) {
    return undefined;
  }

  const host = window.NativeGameHost;
  const mockRewardedAds = Boolean(window.__GAME_PLATFORM_CONFIG__?.mockRewardedAds);
  const renderQuality = normalizeRenderQuality(host?.getRenderQuality?.() ?? host?.renderQuality, resolveConfiguredRenderQuality('balanced'));

  return {
    name: 'google-play',
    renderQuality,
    capabilities: {
      ...defaultCapabilities,
      nativeShell: true,
      rewardedAd: Boolean(host?.showRewardedAd || mockRewardedAds),
      share: Boolean(navigator.share),
      haptic: Boolean(navigator.vibrate),
      analytics: Boolean(host?.track)
    },
    ready: async () => undefined,
    progress: () => undefined,
    haptic: vibrate,
    showRewardedAd: async (placement) => {
      if (host?.showRewardedAd) {
        return host.showRewardedAd(placement);
      }

      if (mockRewardedAds) {
        return resolveMockReward();
      }

      return false;
    },
    share: shareOnWeb,
    track: (event, payload) => {
      host?.track?.(event, payload);
    }
  };
}

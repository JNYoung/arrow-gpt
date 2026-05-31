import {
  defaultCapabilities,
  resolveMockReward,
  resolveConfiguredRenderQuality,
  shareOnWeb,
  vibrate,
  type PlatformBridge
} from './spec';

export function createWebPlatformBridge(): PlatformBridge {
  return {
    name: 'web',
    renderQuality: resolveConfiguredRenderQuality('balanced'),
    capabilities: {
      ...defaultCapabilities,
      rewardedAd: true,
      share: Boolean(navigator.share),
      haptic: Boolean(navigator.vibrate)
    },
    ready: async () => undefined,
    progress: () => undefined,
    haptic: vibrate,
    showRewardedAd: async () => resolveMockReward(),
    share: shareOnWeb,
    track: () => undefined
  };
}

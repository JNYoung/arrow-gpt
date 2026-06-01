import { AdMob, AdmobConsentStatus, MaxAdContentRating, type RewardAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import platformManifest from '../../platform-manifest.json';
import {
  defaultCapabilities,
  normalizeRenderQuality,
  normalizeSharePayload,
  resolveConfiguredRenderQuality,
  resolveMockReward,
  shareOnWeb,
  vibrate,
  type PlatformBridge,
  type PlatformEventPayload,
  type RenderQuality,
  type RewardedPlacement,
  type SharePayload
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

type NativePlatform = 'android' | 'ios';

type AdMobManifestPlatform = {
  adMobAppId?: string;
  rewardedPlacements?: Partial<Record<RewardedPlacement, string>>;
};

type AdMobManifest = {
  releaseAssets?: {
    appHomeUrl?: string;
  };
  platforms?: {
    googlePlayAndroid?: AdMobManifestPlatform;
    iosAppStore?: AdMobManifestPlatform;
  };
};

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
    NativeGameHost?: NativeGameHost;
  }
}

const manifest = platformManifest as AdMobManifest;
const rewardedAdUnitPattern = /^ca-app-pub-\d{16}\/\d{10}$/;
const placeholderPattern = /^(TODO|TBD|REPLACE|PLACEHOLDER|ADMOB_)/i;
const sampleRewardedAdUnits: Record<NativePlatform, string> = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313'
};

let adMobReady: Promise<boolean> | undefined;

export function createGooglePlatformBridge(): PlatformBridge | undefined {
  const platform = getNativePlatform();

  if (!platform) {
    return undefined;
  }

  const host = window.NativeGameHost;
  const mockRewardedAds = Boolean(window.__GAME_PLATFORM_CONFIG__?.mockRewardedAds);
  const adMobTestMode = Boolean(window.__GAME_PLATFORM_CONFIG__?.adMobTestMode);
  const placements = resolveNativeRewardedPlacements(platform);
  const supportsRewardedAd = Boolean(host?.showRewardedAd || mockRewardedAds || hasConfiguredRewardedAdUnit(placements) || adMobTestMode);
  const renderQuality = normalizeRenderQuality(host?.getRenderQuality?.() ?? host?.renderQuality, resolveConfiguredRenderQuality('balanced'));

  return {
    name: platform === 'ios' ? 'ios-app-store' : 'google-play',
    renderQuality,
    capabilities: {
      ...defaultCapabilities,
      nativeShell: true,
      rewardedAd: supportsRewardedAd,
      share: true,
      haptic: Boolean(navigator.vibrate),
      analytics: Boolean(host?.track)
    },
    ready: async () => {
      if (supportsRewardedAd && !host?.showRewardedAd && !mockRewardedAds) {
        await ensureAdMobReady();
      }
    },
    progress: () => undefined,
    haptic: vibrate,
    showRewardedAd: async (placement) => {
      if (host?.showRewardedAd) {
        return host.showRewardedAd(placement);
      }

      if (mockRewardedAds) {
        return resolveMockReward();
      }

      return showAdMobRewardedAd(platform, placement, placements, adMobTestMode);
    },
    share: shareOnNative,
    track: (event, payload) => {
      host?.track?.(event, payload);
    }
  };
}

function getNativePlatform(): NativePlatform | undefined {
  const platform = Capacitor.getPlatform?.() ?? window.Capacitor?.getPlatform?.();
  const isNative = Capacitor.isNativePlatform?.() ?? window.Capacitor?.isNativePlatform?.();

  if (!isNative) {
    return undefined;
  }

  return platform === 'android' || platform === 'ios' ? platform : undefined;
}

function resolveNativeRewardedPlacements(platform: NativePlatform): Partial<Record<RewardedPlacement, string>> {
  const manifestPlacements =
    platform === 'ios'
      ? manifest.platforms?.iosAppStore?.rewardedPlacements
      : manifest.platforms?.googlePlayAndroid?.rewardedPlacements;

  return {
    ...manifestPlacements,
    ...window.__GAME_PLATFORM_CONFIG__?.rewardedPlacements
  };
}

function hasConfiguredRewardedAdUnit(placements: Partial<Record<RewardedPlacement, string>>): boolean {
  return Object.values(placements).some(isUsableAdUnitId);
}

function isUsableAdUnitId(value?: string): value is string {
  return Boolean(value && rewardedAdUnitPattern.test(value) && !placeholderPattern.test(value));
}

async function ensureAdMobReady(): Promise<boolean> {
  adMobReady ??= initializeAdMob();
  return adMobReady;
}

async function initializeAdMob(): Promise<boolean> {
  try {
    await AdMob.initialize({
      testingDevices: window.__GAME_PLATFORM_CONFIG__?.adMobTestDeviceIds,
      initializeForTesting: Boolean(window.__GAME_PLATFORM_CONFIG__?.adMobTestMode),
      maxAdContentRating: MaxAdContentRating.General
    });

    await requestAdMobConsent();
    return true;
  } catch (error) {
    console.warn('AdMob initialization failed', error);
    return false;
  }
}

async function requestAdMobConsent(): Promise<void> {
  try {
    const consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo.canRequestAds) {
      return;
    }

    if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
  } catch (error) {
    console.warn('AdMob consent request failed', error);
  }
}

async function showAdMobRewardedAd(
  platform: NativePlatform,
  placement: RewardedPlacement,
  placements: Partial<Record<RewardedPlacement, string>>,
  adMobTestMode: boolean
): Promise<boolean> {
  const configuredAdId = placements[placement];
  const adId = isUsableAdUnitId(configuredAdId) ? configuredAdId : adMobTestMode ? sampleRewardedAdUnits[platform] : undefined;

  if (!adId || !(await ensureAdMobReady())) {
    return false;
  }

  try {
    const options: RewardAdOptions = {
      adId,
      isTesting: adMobTestMode,
      immersiveMode: true,
      ssv: {
        customData: JSON.stringify({ source: 'arrow-again', placement })
      }
    };
    await AdMob.prepareRewardVideoAd(options);
    const reward = await AdMob.showRewardVideoAd();
    return reward.amount > 0 || reward.type.length > 0;
  } catch (error) {
    console.warn(`AdMob rewarded ad failed for ${placement}`, error);
    return false;
  }
}

async function shareOnNative(payload: string | SharePayload): Promise<void> {
  const normalized = normalizeSharePayload(payload);
  const url = resolveNativeShareUrl(normalized);

  try {
    const canShare = await Share.canShare();
    if (canShare.value) {
      await Share.share({
        title: normalized.title ?? 'Arrow Again',
        text: normalized.text,
        url,
        dialogTitle: '分享 Arrow Again'
      });
      return;
    }
  } catch (error) {
    console.warn('Native share failed, falling back to Web Share API', error);
  }

  await shareOnWeb({ ...normalized, url });
}

function resolveNativeShareUrl(payload: SharePayload): string | undefined {
  return [window.__GAME_PLATFORM_CONFIG__?.shareUrl, manifest.releaseAssets?.appHomeUrl, payload.url].find(isPublicShareUrl);
}

function isPublicShareUrl(value?: string): value is string {
  if (!value || placeholderPattern.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
  } catch {
    return false;
  }
}

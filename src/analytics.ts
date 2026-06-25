import type { PlatformEventPayload } from './platform/spec';

export type AnalyticsSession = {
  installId: string;
  sessionId: string;
  sessionIndex: number;
  daysSinceInstall: number;
};

export type CampaignAttribution = {
  traffic_source?: string;
  traffic_medium?: string;
  traffic_campaign?: string;
  traffic_content?: string;
  traffic_term?: string;
  campaign_id?: string;
  creative_id?: string;
  referrer_host?: string;
};

type AnalyticsIdentity = {
  installId: string;
  firstSeenAt: string;
  sessionIndex: number;
};

type Gtag = (...args: unknown[]) => void;

const identityStorageKey = 'arrow-again-analytics-v1';
const attributionStorageKey = 'arrow-again-campaign-attribution-v1';
const attributionTtlMs = 30 * 24 * 60 * 60 * 1000;
const measurementIdPattern = /^G-[A-Z0-9]+$/i;
const attributionAliases = {
  traffic_source: ['utm_source', 'source', 'src'],
  traffic_medium: ['utm_medium', 'medium'],
  traffic_campaign: ['utm_campaign', 'campaign'],
  traffic_content: ['utm_content', 'content'],
  traffic_term: ['utm_term', 'term', 'keyword'],
  campaign_id: ['campaign_id', 'utm_id'],
  creative_id: ['creative_id', 'creative', 'utm_creative']
} as const;

let initializedMeasurementId: string | undefined;
let scriptRequested = false;

declare global {
  interface ImportMeta {
    env?: Record<string, string | boolean | undefined>;
  }

  interface Window {
    dataLayer?: unknown[][];
    gtag?: Gtag;
  }
}

export function createAnalyticsId(prefix: string): string {
  const randomId = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${randomId.replace(/[^a-z0-9-]/gi, '').toLowerCase()}`;
}

export function startAnalyticsSession(now = new Date()): AnalyticsSession {
  const identity = loadAnalyticsIdentity(now);
  identity.sessionIndex += 1;
  saveAnalyticsIdentity(identity);

  return {
    installId: identity.installId,
    sessionId: createAnalyticsId('session'),
    sessionIndex: identity.sessionIndex,
    daysSinceInstall: getDateDeltaDays(identity.firstSeenAt, now.toISOString())
  };
}

export function getCampaignAttribution(now = new Date()): CampaignAttribution {
  const current = readCampaignAttributionFromUrl(now);
  if (Object.keys(current.values).length > 0) {
    saveCampaignAttribution(current);
    return current.values;
  }

  const stored = loadCampaignAttribution(now);
  return stored?.values ?? {};
}

export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(getGoogleAnalyticsMeasurementId());
}

export function trackGoogleAnalytics(event: string, payload: PlatformEventPayload = {}): void {
  const measurementId = getGoogleAnalyticsMeasurementId();
  if (!measurementId) {
    return;
  }

  initializeGoogleAnalytics(measurementId);
  window.gtag?.('event', sanitizeEventName(event), sanitizePayload(payload));
}

function initializeGoogleAnalytics(measurementId: string): void {
  if (initializedMeasurementId === measurementId) {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  requestGoogleAnalyticsScript(measurementId);
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    debug_mode: isGoogleAnalyticsDebugEnabled(),
    app_name: 'Arrow Again',
    app_version: getConfiguredAppVersion()
  });
  initializedMeasurementId = measurementId;
}

function requestGoogleAnalyticsScript(measurementId: string): void {
  if (scriptRequested) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.arrowAgainGa4 = measurementId;
  document.head.appendChild(script);
  scriptRequested = true;
}

function getGoogleAnalyticsMeasurementId(): string | undefined {
  if (window.__GAME_PLATFORM_CONFIG__?.gaDisabled) {
    return undefined;
  }

  const configured =
    window.__GAME_PLATFORM_CONFIG__?.gaMeasurementId ??
    getEnvString('VITE_GA_MEASUREMENT_ID') ??
    getEnvString('GA_MEASUREMENT_ID');
  const normalized = configured?.trim();
  return normalized && measurementIdPattern.test(normalized) ? normalized : undefined;
}

function isGoogleAnalyticsDebugEnabled(): boolean {
  return (
    window.__GAME_PLATFORM_CONFIG__?.gaDebug === true ||
    getEnvString('VITE_GA_DEBUG') === 'true' ||
    getEnvString('GA_DEBUG') === 'true'
  );
}

function getConfiguredAppVersion(): string | undefined {
  return window.__GAME_PLATFORM_CONFIG__?.appVersion ?? getEnvString('VITE_APP_VERSION');
}

function getEnvString(key: string): string | undefined {
  const value = import.meta.env?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function sanitizeEventName(event: string): string {
  const normalized = event.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
  return /^[a-zA-Z]/.test(normalized) ? normalized : `game_${normalized}`.slice(0, 40);
}

function sanitizePayload(payload: PlatformEventPayload): PlatformEventPayload {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
      .map(([key, value]) => [sanitizeParamName(key), typeof value === 'string' ? value.slice(0, 100) : value])
  );
}

function sanitizeParamName(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
  return /^[a-zA-Z]/.test(normalized) ? normalized : `p_${normalized}`.slice(0, 40);
}

function loadAnalyticsIdentity(now: Date): AnalyticsIdentity {
  try {
    const raw = window.localStorage.getItem(identityStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AnalyticsIdentity>;
      if (typeof parsed.installId === 'string' && typeof parsed.firstSeenAt === 'string') {
        return {
          installId: parsed.installId,
          firstSeenAt: parsed.firstSeenAt,
          sessionIndex: Math.max(0, parsed.sessionIndex ?? 0)
        };
      }
    }
  } catch {
    // A fresh anonymous identity is safer than breaking startup.
  }

  return {
    installId: createAnalyticsId('install'),
    firstSeenAt: now.toISOString(),
    sessionIndex: 0
  };
}

function saveAnalyticsIdentity(identity: AnalyticsIdentity): void {
  try {
    window.localStorage.setItem(identityStorageKey, JSON.stringify(identity));
  } catch {
    // Analytics identity persistence is best-effort.
  }
}

function readCampaignAttributionFromUrl(now: Date): { values: CampaignAttribution; capturedAt: string } {
  const params = new URLSearchParams(window.location.search);
  const values: CampaignAttribution = {};

  for (const [key, aliases] of Object.entries(attributionAliases) as [keyof CampaignAttribution, readonly string[]][]) {
    const value = aliases.map((alias) => params.get(alias)).find((entry) => entry && entry.trim().length > 0);
    if (value) {
      values[key] = value.trim().slice(0, 100);
    }
  }

  if (!values.traffic_source && document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.hostname && referrer.hostname !== window.location.hostname) {
        values.referrer_host = referrer.hostname.slice(0, 100);
        values.traffic_source = referrer.hostname.slice(0, 100);
        values.traffic_medium = values.traffic_medium ?? 'referral';
      }
    } catch {
      // Ignore malformed referrers.
    }
  }

  return {
    values,
    capturedAt: now.toISOString()
  };
}

function saveCampaignAttribution(attribution: { values: CampaignAttribution; capturedAt: string }): void {
  try {
    window.localStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
  } catch {
    // Attribution persistence is best-effort.
  }
}

function loadCampaignAttribution(now: Date): { values: CampaignAttribution; capturedAt: string } | undefined {
  try {
    const raw = window.localStorage.getItem(attributionStorageKey);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as { values?: CampaignAttribution; capturedAt?: string };
    if (!parsed.values || !parsed.capturedAt) {
      return undefined;
    }

    const ageMs = now.getTime() - new Date(parsed.capturedAt).getTime();
    if (!Number.isFinite(ageMs) || ageMs > attributionTtlMs) {
      window.localStorage.removeItem(attributionStorageKey);
      return undefined;
    }

    return {
      values: parsed.values,
      capturedAt: parsed.capturedAt
    };
  } catch {
    return undefined;
  }
}

function getDateDeltaDays(previousIso: string, nextIso: string): number {
  const previous = new Date(previousIso);
  const next = new Date(nextIso);
  const diff = next.getTime() - previous.getTime();
  return Number.isFinite(diff) ? Math.max(0, Math.floor(diff / 86_400_000)) : 0;
}

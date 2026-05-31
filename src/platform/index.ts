export type {
  PlatformBridge,
  PlatformCapabilities,
  PlatformEventPayload,
  PlatformRuntimeConfig,
  PlatformTarget,
  RenderQuality,
  RewardedPlacement,
  SharePayload
} from './spec';

export { normalizeRenderQuality } from './spec';

import { createGooglePlatformBridge } from './google';
import { createMetaPlatformBridge } from './meta';
import { createWebPlatformBridge } from './web';
import type { PlatformBridge } from './spec';

export function createPlatformBridge(): PlatformBridge {
  return createMetaPlatformBridge() ?? createGooglePlatformBridge() ?? createWebPlatformBridge();
}

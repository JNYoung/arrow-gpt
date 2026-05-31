export type {
  PlatformBridge,
  PlatformCapabilities,
  PlatformEventPayload,
  PlatformRuntimeConfig,
  PlatformTarget,
  RewardedPlacement,
  SharePayload
} from './spec';

import { createGooglePlatformBridge } from './google';
import { createMetaPlatformBridge } from './meta';
import { createWebPlatformBridge } from './web';
import type { PlatformBridge } from './spec';

export function createPlatformBridge(): PlatformBridge {
  return createMetaPlatformBridge() ?? createGooglePlatformBridge() ?? createWebPlatformBridge();
}

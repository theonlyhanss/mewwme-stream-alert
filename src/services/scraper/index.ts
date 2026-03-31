import { checkLive as checkTwitch } from "./twitch.js";
import { checkLive as checkYouTube } from "./youtube.js";
import { checkLive as checkTikTok } from "./tiktok.js";
import type { PlatformChecker } from "./helpers.js";

/**
 * Supported platform names
 */
export const SUPPORTED_PLATFORMS = ["twitch", "youtube", "tiktok"] as const;
export type Platform = (typeof SUPPORTED_PLATFORMS)[number];

/**
 * Platform checker registry
 */
const checkers: Record<Platform, PlatformChecker> = {
  twitch: checkTwitch,
  youtube: checkYouTube,
  tiktok: checkTikTok,
};

/**
 * Get the checker function for a platform
 */
export function getChecker(platform: string): PlatformChecker | undefined {
  return checkers[platform as Platform];
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(platform: string): platform is Platform {
  return SUPPORTED_PLATFORMS.includes(platform as Platform);
}

// Re-export helpers
export type { LiveCheckResult, PlatformChecker } from "./helpers.js";
export { getRandomUserAgent, randomDelay, withRetry, sleep } from "./helpers.js";

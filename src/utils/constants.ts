import type { Platform, PlatformConfig } from "../types/index.js";

/**
 * Platform display configuration
 */
export const PLATFORMS: Record<Platform, PlatformConfig> = {
  twitch: {
    name: "Twitch",
    color: "#9146ff",
    emoji: "🟣",
    urlTemplate: "https://twitch.tv/{username}",
  },
  youtube: {
    name: "YouTube",
    color: "#ff0000",
    emoji: "🔴",
    urlTemplate: "https://youtube.com/@{username}",
  },
  tiktok: {
    name: "TikTok",
    color: "#010101",
    emoji: "⚫",
    urlTemplate: "https://tiktok.com/@{username}/live",
  },
};

/**
 * Get URL for a streamer
 */
export function getStreamUrl(platform: Platform, username: string): string {
  return PLATFORMS[platform].urlTemplate.replace("{username}", username);
}

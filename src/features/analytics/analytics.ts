import type { PageViewDevice, PageViewOperatingSystem } from "@/lib/db/schema";
import { ANALYTICS_RANGES, type AnalyticsRange } from "./analytics.schema";

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|phantom|preview|curl|wget|python-requests|httpclient|ahrefs|semrush/i;

const MOBILE_PATTERN =
  /mobile|iphone|ipod|android.*mobile|windows phone|iemobile|opera mini|blackberry/i;

const TABLET_PATTERN = /ipad|tablet|playbook|silk|android(?!.*mobile)/i;

/** Private areas the public page-view tracker should never count. */
const PRIVATE_PATH_PREFIXES = ["/admin", "/api", "/login", "/logout"];

export type AnalyticsWindow = {
  startAt: number;
  endAt: number;
};

export type UserAgentInfo = {
  device: PageViewDevice;
  os: PageViewOperatingSystem;
};

export function isAnalyticsRange(value: string): value is AnalyticsRange {
  return (ANALYTICS_RANGES as readonly string[]).includes(value);
}

/** The last N days up to now, unlike post popularity's complete UTC days. */
export function getAnalyticsWindow(
  range: AnalyticsRange,
  now: Date,
): AnalyticsWindow {
  const endAt = now.getTime();
  return { startAt: endAt - RANGE_DAYS[range] * DAY_MS, endAt };
}

/**
 * A same-site path to record: no query, no hash, no trailing slash. Returns
 * null for anything that is not a public page.
 */
export function normalizeAnalyticsPath(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value, "https://blog.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://blog.invalid") return null;

  const pathname =
    url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (!pathname.startsWith("/") || pathname.length > 512) return null;
  if (
    PRIVATE_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }
  return pathname;
}

export function parseUserAgent(userAgent: string | null): UserAgentInfo {
  const ua = userAgent?.trim() ?? "";
  if (!ua) return { device: "unknown", os: "unknown" };

  const os = detectOperatingSystem(ua);
  if (BOT_PATTERN.test(ua)) return { device: "bot", os };

  if (TABLET_PATTERN.test(ua)) return { device: "tablet", os };
  if (MOBILE_PATTERN.test(ua)) return { device: "mobile", os };
  return { device: "desktop", os };
}

function detectOperatingSystem(ua: string): PageViewOperatingSystem {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/cros/i.test(ua)) return "chromeos";
  if (/windows/i.test(ua)) return "windows";
  if (/macintosh|mac os x/i.test(ua)) return "macos";
  if (/linux/i.test(ua)) return "linux";
  return "other";
}

/** The visitor's real address as Cloudflare saw it. */
export function requestIp(request: Request): string | null {
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  return ip || null;
}

type CloudflareProperties = {
  country?: string | null;
  region?: string | null;
};

export function requestLocation(request: Request): {
  country: string | null;
  region: string | null;
} {
  const cf = (request as Request & { cf?: CloudflareProperties }).cf;
  const country = cf?.country?.trim();
  const region = cf?.region?.trim();
  return {
    country: country ? country.toUpperCase() : null,
    region: region || null,
  };
}

import { postSlugFromPath } from "@/features/post-popularity/post-popularity";
import type { DB } from "@/lib/db";
import {
  getAnalyticsWindow,
  normalizeAnalyticsPath,
  parseUserAgent,
  requestIp,
  requestLocation,
} from "../analytics";
import {
  AnalyticsOverviewSchema,
  type AnalyticsOverview,
  type AnalyticsRange,
} from "../analytics.schema";
import * as AnalyticsRepo from "../data/analytics.data";

/** Records one public page view unless the path is private or the UA is a bot. */
export async function recordPageView({
  db,
  request,
  path,
}: {
  db: DB;
  request: Request;
  path: string;
}): Promise<boolean> {
  const normalizedPath = normalizeAnalyticsPath(path);
  if (!normalizedPath) return false;

  const { device, os } = parseUserAgent(request.headers.get("user-agent"));
  if (device === "bot") return false;

  const { country, region } = requestLocation(request);
  await AnalyticsRepo.insertPageView(db, {
    path: normalizedPath,
    postSlug: postSlugFromPath(normalizedPath),
    device,
    os,
    country,
    region,
    ip: requestIp(request),
  });
  return true;
}

export async function getOverview(
  db: DB,
  range: AnalyticsRange,
  now = new Date(),
): Promise<AnalyticsOverview> {
  const window = getAnalyticsWindow(range, now);
  const [
    totals,
    devices,
    operatingSystems,
    countries,
    regions,
    topPaths,
    recentVisits,
  ] = await Promise.all([
    AnalyticsRepo.getTotals(db, window),
    AnalyticsRepo.listDevices(db, window),
    AnalyticsRepo.listOperatingSystems(db, window),
    AnalyticsRepo.listCountries(db, window),
    AnalyticsRepo.listRegions(db, window),
    AnalyticsRepo.listTopPaths(db, window),
    AnalyticsRepo.listRecentVisits(db, window),
  ]);

  return AnalyticsOverviewSchema.parse({
    range,
    windowStart: window.startAt,
    windowEnd: window.endAt,
    totals,
    devices,
    operatingSystems,
    countries,
    regions,
    topPaths,
    recentVisits: recentVisits.map((visit) => ({
      ...visit,
      createdAt: visit.createdAt.getTime(),
    })),
  });
}

import { and, count, desc, gte, isNotNull, lte, sql } from "drizzle-orm";
import type {
  PostPopularityMetric,
  PostPopularityWindow,
} from "@/features/post-popularity/post-popularity";
import type { DB } from "@/lib/db";
import { PageViewsTable, type PageView } from "@/lib/db/schema";
import type { AnalyticsWindow } from "../analytics";

const countryName = sql<string>`coalesce(${PageViewsTable.country}, 'unknown')`;
const regionName = sql<string>`coalesce(${PageViewsTable.region}, 'unknown')`;

function withinWindow(window: AnalyticsWindow | PostPopularityWindow) {
  return and(
    gte(PageViewsTable.createdAt, new Date(window.startAt)),
    lte(PageViewsTable.createdAt, new Date(window.endAt)),
  );
}

export async function insertPageView(
  db: DB,
  view: Omit<PageView, "id" | "createdAt">,
): Promise<void> {
  await db.insert(PageViewsTable).values(view);
}

/**
 * Page views for public Posts in the given window, keyed by the path that was
 * requested. Post popularity maps these paths to current slugs.
 */
export async function listPostPathMetrics(
  db: DB,
  window: PostPopularityWindow,
): Promise<PostPopularityMetric[]> {
  const rows = await db
    .select({ path: PageViewsTable.path, pageviews: count() })
    .from(PageViewsTable)
    .where(and(withinWindow(window), isNotNull(PageViewsTable.postSlug)))
    .groupBy(PageViewsTable.path);
  return rows.map((row) => ({
    path: row.path,
    pageviews: row.pageviews,
  }));
}

export async function getTotals(db: DB, window: AnalyticsWindow) {
  const [row] = await db
    .select({
      pageViews: count(),
      visitors: sql<number>`count(distinct ${PageViewsTable.ip})`,
    })
    .from(PageViewsTable)
    .where(withinWindow(window));
  return row ?? { pageViews: 0, visitors: 0 };
}

export function listDevices(db: DB, window: AnalyticsWindow) {
  return db
    .select({ name: PageViewsTable.device, count: count() })
    .from(PageViewsTable)
    .where(withinWindow(window))
    .groupBy(PageViewsTable.device)
    .orderBy(desc(count()));
}

export function listOperatingSystems(db: DB, window: AnalyticsWindow) {
  return db
    .select({ name: PageViewsTable.os, count: count() })
    .from(PageViewsTable)
    .where(withinWindow(window))
    .groupBy(PageViewsTable.os)
    .orderBy(desc(count()));
}

export function listCountries(db: DB, window: AnalyticsWindow) {
  return db
    .select({ name: countryName, count: count() })
    .from(PageViewsTable)
    .where(withinWindow(window))
    .groupBy(countryName)
    .orderBy(desc(count()))
    .limit(10);
}

export function listRegions(db: DB, window: AnalyticsWindow) {
  return db
    .select({ name: regionName, count: count() })
    .from(PageViewsTable)
    .where(withinWindow(window))
    .groupBy(regionName)
    .orderBy(desc(count()))
    .limit(10);
}

export function listTopPaths(db: DB, window: AnalyticsWindow) {
  return db
    .select({ path: PageViewsTable.path, count: count() })
    .from(PageViewsTable)
    .where(withinWindow(window))
    .groupBy(PageViewsTable.path)
    .orderBy(desc(count()))
    .limit(10);
}

export function listRecentVisits(db: DB, window: AnalyticsWindow) {
  return db
    .select({
      id: PageViewsTable.id,
      path: PageViewsTable.path,
      device: PageViewsTable.device,
      os: PageViewsTable.os,
      country: PageViewsTable.country,
      region: PageViewsTable.region,
      ip: PageViewsTable.ip,
      createdAt: PageViewsTable.createdAt,
    })
    .from(PageViewsTable)
    .where(withinWindow(window))
    .orderBy(desc(PageViewsTable.createdAt), desc(PageViewsTable.id))
    .limit(20);
}

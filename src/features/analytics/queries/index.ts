import { orpc } from "@/lib/orpc";
import type { AnalyticsRange } from "@/features/analytics/analytics.schema";

export const analyticsOverviewQuery = (range: AnalyticsRange) =>
  orpc.analytics.overview.queryOptions({ input: { range } });

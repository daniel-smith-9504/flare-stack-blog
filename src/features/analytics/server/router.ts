import {
  AnalyticsOverviewInputSchema,
  AnalyticsOverviewSchema,
} from "@/features/analytics/analytics.schema";
import { getOverview } from "@/features/analytics/service/analytics.service";
import { adminProcedure } from "@/lib/orpc/procedure";

const overview = adminProcedure
  .route({
    method: "GET",
    path: "/admin/analytics",
    summary: "Get first-party traffic analytics",
    tags: ["Admin Analytics"],
  })
  .input(AnalyticsOverviewInputSchema)
  .output(AnalyticsOverviewSchema)
  .handler(({ context, input }) => getOverview(context.db, input.range));

export default { overview };

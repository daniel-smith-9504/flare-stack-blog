import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AnalyticsPage } from "@/features/analytics/components/analytics-page";
import { ANALYTICS_RANGES } from "@/features/analytics/analytics.schema";
import { analyticsOverviewQuery } from "@/features/analytics/queries";
import { m } from "@/paraglide/messages";

const searchSchema = z.object({
  range: z.enum(ANALYTICS_RANGES).optional().default("7d").catch("7d"),
});

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  validateSearch: searchSchema,
  loaderDeps: ({ search: { range } }) => ({ range }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      analyticsOverviewQuery(deps.range),
    );
    return { title: m.admin_analytics_title() };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title }],
  }),
  component: AnalyticsAdminPage,
});

function AnalyticsAdminPage() {
  const { range } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <AnalyticsPage
      range={range}
      onRangeChange={(next) =>
        navigate({ search: { range: next }, replace: true })
      }
    />
  );
}

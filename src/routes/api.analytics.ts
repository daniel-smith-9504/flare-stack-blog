import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsCollectSchema } from "@/features/analytics/analytics.schema";
import { recordPageView } from "@/features/analytics/service/analytics.service";
import { getDb } from "@/lib/db";
import { enforceIpRateLimit } from "@/lib/http/rate-limit";

const MAX_BODY_BYTES = 2048;

export const Route = createFileRoute("/api/analytics")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return new Response("Forbidden", { status: 403 });
        }

        const limited = await enforceIpRateLimit(request, {
          capacity: 60,
          interval: "1m",
          key: "analytics",
        });
        if (limited) return limited;

        const text = await request.text();
        if (text.length > MAX_BODY_BYTES) {
          return new Response("Payload Too Large", { status: 413 });
        }

        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          return new Response("Bad Request", { status: 400 });
        }
        const parsed = AnalyticsCollectSchema.safeParse(body);
        if (!parsed.success) {
          return new Response("Bad Request", { status: 400 });
        }

        await recordPageView({
          db: getDb(context.env),
          request,
          path: parsed.data.path,
        });
        return new Response(null, { status: 204 });
      },
    },
  },
});

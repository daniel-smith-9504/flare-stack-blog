import { z } from "zod";
import {
  PAGE_VIEW_DEVICES,
  PAGE_VIEW_OPERATING_SYSTEMS,
} from "@/lib/db/schema";

export const ANALYTICS_RANGES = ["7d", "30d", "90d"] as const;

export const AnalyticsRangeSchema = z.enum(ANALYTICS_RANGES);

export const AnalyticsOverviewInputSchema = z.object({
  range: AnalyticsRangeSchema.default("7d"),
});

export const AnalyticsCollectSchema = z.object({
  path: z.string().min(1).max(2048),
});

const DistributionItemSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
});

const TopPathSchema = z.object({
  path: z.string(),
  count: z.number().int().nonnegative(),
});

const RecentVisitSchema = z.object({
  id: z.number().int().positive(),
  path: z.string(),
  device: z.enum(PAGE_VIEW_DEVICES),
  os: z.enum(PAGE_VIEW_OPERATING_SYSTEMS),
  country: z.string().nullable(),
  region: z.string().nullable(),
  ip: z.string().nullable(),
  createdAt: z.number().int().nonnegative(),
});

export const AnalyticsOverviewSchema = z.object({
  range: AnalyticsRangeSchema,
  windowStart: z.number().int().nonnegative(),
  windowEnd: z.number().int().nonnegative(),
  totals: z.object({
    pageViews: z.number().int().nonnegative(),
    visitors: z.number().int().nonnegative(),
  }),
  devices: z.array(DistributionItemSchema),
  operatingSystems: z.array(DistributionItemSchema),
  countries: z.array(DistributionItemSchema),
  regions: z.array(DistributionItemSchema),
  topPaths: z.array(TopPathSchema),
  recentVisits: z.array(RecentVisitSchema),
});

export type AnalyticsRange = z.infer<typeof AnalyticsRangeSchema>;
export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

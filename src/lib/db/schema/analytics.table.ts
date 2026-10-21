import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id } from "./helper";

export const PAGE_VIEW_DEVICES = [
  "desktop",
  "mobile",
  "tablet",
  "bot",
  "unknown",
] as const;

export const PAGE_VIEW_OPERATING_SYSTEMS = [
  "windows",
  "macos",
  "ios",
  "android",
  "linux",
  "chromeos",
  "other",
  "unknown",
] as const;

export const PageViewsTable = sqliteTable(
  "page_views",
  {
    id,
    path: text().notNull(),
    postSlug: text("post_slug"),
    device: text("device", { enum: PAGE_VIEW_DEVICES })
      .notNull()
      .default("unknown"),
    os: text("os", { enum: PAGE_VIEW_OPERATING_SYSTEMS })
      .notNull()
      .default("unknown"),
    /** ISO 3166-1 alpha-2 country code from Cloudflare. */
    country: text(),
    /** Region name from Cloudflare, e.g. "California" or "Zhejiang". */
    region: text(),
    /** The visitor's address (`cf-connecting-ip`), stored in full. */
    ip: text(),
    createdAt,
  },
  (table) => [
    index("page_views_created_at_idx").on(table.createdAt),
    index("page_views_post_slug_created_at_idx").on(
      table.postSlug,
      table.createdAt,
    ),
  ],
);

export type PageView = typeof PageViewsTable.$inferSelect;
export type PageViewDevice = (typeof PAGE_VIEW_DEVICES)[number];
export type PageViewOperatingSystem =
  (typeof PAGE_VIEW_OPERATING_SYSTEMS)[number];

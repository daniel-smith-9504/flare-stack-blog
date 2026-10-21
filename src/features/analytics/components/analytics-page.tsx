import { useSuspenseQuery } from "@tanstack/react-query";
import { MousePointerClick, Users } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCount } from "@/features/dashboard/components/format";
import {
  RankedBarList,
  RankedBarRow,
} from "@/features/dashboard/components/ranked-bar-list";
import { getLocale } from "@/paraglide/runtime";
import { m } from "@/paraglide/messages";
import { formatDate } from "@/lib/utils";
import { ANALYTICS_RANGES, type AnalyticsRange } from "../analytics.schema";
import { analyticsOverviewQuery } from "../queries";
import "./analytics.css";

function rangeLabel(range: AnalyticsRange) {
  switch (range) {
    case "7d":
      return m.admin_analytics_range_7d();
    case "30d":
      return m.admin_analytics_range_30d();
    case "90d":
      return m.admin_analytics_range_90d();
    default:
      range satisfies never;
      return "";
  }
}

function deviceLabel(device: string) {
  switch (device) {
    case "desktop":
      return m.admin_analytics_device_desktop();
    case "mobile":
      return m.admin_analytics_device_mobile();
    case "tablet":
      return m.admin_analytics_device_tablet();
    case "bot":
      return m.admin_analytics_device_bot();
    default:
      return m.admin_analytics_unknown();
  }
}

function osLabel(os: string) {
  switch (os) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "ios":
      return "iOS";
    case "android":
      return "Android";
    case "linux":
      return "Linux";
    case "chromeos":
      return "ChromeOS";
    case "other":
      return m.admin_analytics_other();
    default:
      return m.admin_analytics_unknown();
  }
}

function countryLabel(country: string) {
  if (country === "unknown") return m.admin_analytics_unknown();
  try {
    const names = new Intl.DisplayNames(
      [getLocale() === "zh" ? "zh-CN" : "en-US"],
      { type: "region" },
    );
    return `${names.of(country) ?? country} · ${country}`;
  } catch {
    return country;
  }
}

function maxOf(items: Array<{ count: number }>) {
  return Math.max(1, ...items.map((item) => item.count));
}

function BarList({
  items,
  label,
}: {
  items: Array<{ name: string; count: number }>;
  label: (name: string) => string;
}) {
  const max = maxOf(items);
  return (
    <RankedBarList>
      {items.map((item, index) => (
        <RankedBarRow
          key={item.name}
          rank={index + 1}
          title={label(item.name)}
          value={item.count}
          max={max}
          valueText={formatCount(item.count)}
        />
      ))}
    </RankedBarList>
  );
}

export function AnalyticsPage({
  range,
  onRangeChange,
}: {
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
}) {
  const { data } = useSuspenseQuery(analyticsOverviewQuery(range));
  const hasVisits = data.totals.pageViews > 0;
  const countryCount = data.countries.filter(
    (item) => item.name !== "unknown",
  ).length;

  return (
    <div className="analytics-workspace admin-workspace fuwari-card-base">
      <PageHeader
        title={m.admin_analytics_title()}
        description={m.admin_analytics_desc()}
        actions={
          <div
            className="analytics-ranges"
            role="group"
            aria-label={m.admin_analytics_range_label()}
          >
            {ANALYTICS_RANGES.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={option === range ? "primary" : "plain"}
                aria-pressed={option === range}
                onClick={() => onRangeChange(option)}
              >
                {rangeLabel(option)}
              </Button>
            ))}
          </div>
        }
      />

      {hasVisits ? (
        <>
          <ul className="analytics-summary">
            <li>
              <span className="analytics-summary-label">
                <MousePointerClick size={15} aria-hidden="true" />
                {m.admin_analytics_page_views()}
              </span>
              <strong>{formatCount(data.totals.pageViews)}</strong>
            </li>
            <li>
              <span className="analytics-summary-label">
                <Users size={15} aria-hidden="true" />
                {m.admin_analytics_visitors()}
              </span>
              <strong>{formatCount(data.totals.visitors)}</strong>
            </li>
            <li>
              <span className="analytics-summary-label">
                {m.admin_analytics_countries_count()}
              </span>
              <strong>{formatCount(countryCount)}</strong>
            </li>
          </ul>

          <div className="analytics-grid">
            <section className="analytics-card">
              <SectionHeading
                level={3}
                size="sm"
                title={m.admin_analytics_devices()}
              />
              <BarList items={data.devices} label={deviceLabel} />
            </section>
            <section className="analytics-card">
              <SectionHeading
                level={3}
                size="sm"
                title={m.admin_analytics_os()}
              />
              <BarList items={data.operatingSystems} label={osLabel} />
            </section>
            <section className="analytics-card">
              <SectionHeading
                level={3}
                size="sm"
                title={m.admin_analytics_countries()}
              />
              <BarList items={data.countries} label={countryLabel} />
            </section>
            <section className="analytics-card">
              <SectionHeading
                level={3}
                size="sm"
                title={m.admin_analytics_regions()}
              />
              <BarList
                items={data.regions}
                label={(name) =>
                  name === "unknown" ? m.admin_analytics_unknown() : name
                }
              />
            </section>
            <section className="analytics-card analytics-card-wide">
              <SectionHeading
                level={3}
                size="sm"
                title={m.admin_analytics_top_paths()}
              />
              <BarList
                items={data.topPaths.map((item) => ({
                  name: item.path,
                  count: item.count,
                }))}
                label={(name) => name}
              />
            </section>
          </div>

          <section className="analytics-recent">
            <SectionHeading
              level={3}
              size="sm"
              title={m.admin_analytics_recent()}
              description={m.admin_analytics_recent_desc()}
            />
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>{m.admin_analytics_column_time()}</th>
                    <th>{m.admin_analytics_column_path()}</th>
                    <th>{m.admin_analytics_column_device()}</th>
                    <th>{m.admin_analytics_column_os()}</th>
                    <th>{m.admin_analytics_column_location()}</th>
                    <th>{m.admin_analytics_column_ip()}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentVisits.map((visit) => (
                    <tr key={visit.id}>
                      <td>
                        {formatDate(visit.createdAt, { includeTime: true })}
                      </td>
                      <td className="analytics-path">{visit.path}</td>
                      <td>{deviceLabel(visit.device)}</td>
                      <td>{osLabel(visit.os)}</td>
                      <td>
                        {visit.country
                          ? countryLabel(visit.country)
                          : m.admin_analytics_unknown()}
                        {visit.region ? ` · ${visit.region}` : ""}
                      </td>
                      <td className="analytics-ip">{visit.ip ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          icon={MousePointerClick}
          title={m.admin_analytics_empty_title()}
          description={m.admin_analytics_empty_desc()}
        />
      )}
    </div>
  );
}

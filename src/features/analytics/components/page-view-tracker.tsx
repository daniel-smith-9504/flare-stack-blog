import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const ENDPOINT = "/api/analytics";

/** Sends one first-party page view for the initial load and every navigation. */
export function PageViewTracker() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const body = JSON.stringify({ path: pathname });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.(ENDPOINT, blob)) return;

    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}

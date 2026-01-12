import { useQuery } from "@tanstack/react-query";
import { Link2, ExternalLink, MousePointerClick } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, startOfDay, endOfDay } from "date-fns";

interface LinksStatsProps {
  siteId: string;
  dateRange: DateRange;
}

interface OutboundLink {
  href: string;
  clicks: number;
  lastClicked: string;
  text?: string;
}

function getDateRangeFilter(dateRange: DateRange): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  let start: Date;

  switch (dateRange) {
    case "today":
      start = startOfDay(new Date());
      break;
    case "7d":
      start = startOfDay(subDays(new Date(), 7));
      break;
    case "30d":
      start = startOfDay(subDays(new Date(), 30));
      break;
    case "90d":
      start = startOfDay(subDays(new Date(), 90));
      break;
    default:
      start = startOfDay(subDays(new Date(), 7));
  }

  return { start, end };
}

function useOutboundLinks({ siteId, dateRange }: LinksStatsProps) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["outbound-links", siteId, dateRange],
    queryFn: async (): Promise<OutboundLink[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("properties, created_at")
        .eq("site_id", siteId)
        .eq("event_name", "outbound")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Aggregate by href
      const linkMap = new Map<string, { clicks: number; lastClicked: string; text?: string }>();

      for (const event of data || []) {
        const props = event.properties as { href?: string; text?: string } | null;
        const href = props?.href;
        if (!href) continue;

        const existing = linkMap.get(href);
        if (existing) {
          existing.clicks += 1;
          // Keep the most recent click time
          if (new Date(event.created_at) > new Date(existing.lastClicked)) {
            existing.lastClicked = event.created_at;
          }
        } else {
          linkMap.set(href, {
            clicks: 1,
            lastClicked: event.created_at,
            text: props?.text,
          });
        }
      }

      // Convert to array and sort by clicks
      return Array.from(linkMap.entries())
        .map(([href, stats]) => ({
          href,
          ...stats,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
    },
    enabled: !!siteId,
  });
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function LinksStats({ siteId, dateRange }: LinksStatsProps) {
  const { data: links, isLoading } = useOutboundLinks({ siteId, dateRange });

  const totalClicks = links?.reduce((sum, link) => sum + link.clicks, 0) || 0;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Outbound Links</h3>
          </div>
          {!isLoading && totalClicks > 0 && (
            <div className="flex items-center gap-1 text-xs text-base-content/60">
              <MousePointerClick className="h-3 w-3" />
              <span>{totalClicks} clicks</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : links && links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link, idx) => {
              const percentage = totalClicks > 0 ? (link.clicks / totalClicks) * 100 : 0;
              return (
                <div
                  key={link.href}
                  className="relative group"
                >
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                    <div className="flex items-center justify-center h-8 w-8 rounded bg-base-200 text-xs font-medium text-base-content/60">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium truncate max-w-[200px]" title={link.href}>
                          {getDomain(link.href)}
                        </span>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3 w-3 text-base-content/50 hover:text-primary" />
                        </a>
                      </div>
                      {link.text && (
                        <p className="text-xs text-base-content/50 truncate" title={link.text}>
                          "{link.text}"
                        </p>
                      )}
                      <p className="text-[10px] text-base-content/40">
                        Last: {formatDistanceToNow(new Date(link.lastClicked), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold">{link.clicks}</div>
                      <div className="text-[10px] text-base-content/50">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-base-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/40 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-base-content/60">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No outbound link clicks tracked yet</p>
            <p className="text-xs mt-1">
              Clicks on external links will appear here automatically
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

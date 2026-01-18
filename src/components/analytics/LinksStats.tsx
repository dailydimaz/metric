import { useQuery } from "@tanstack/react-query";
import { Link2, ExternalLink, MousePointerClick } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Link2 className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Outbound Links</CardTitle>
        </div>
        {!isLoading && totalClicks > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <MousePointerClick className="h-3 w-3" />
            <span>{totalClicks} clicks</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : links && links.length > 0 ? (
          <div className="flex flex-col">
            {links.map((link, idx) => {
              const percentage = totalClicks > 0 ? (link.clicks / totalClicks) * 100 : 0;
              return (
                <div
                  key={link.href}
                  className="relative group border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors z-10 relative">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-xs font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate max-w-[200px]" title={link.href}>
                          {getDomain(link.href)}
                        </span>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </a>
                      </div>
                      {link.text && (
                        <p className="text-xs text-muted-foreground truncate max-w-[250px] mt-0.5" title={link.text}>
                          "{link.text}"
                        </p>
                      )}

                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold tabular-nums">{link.clicks}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 h-[3px] bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-20" style={{ width: `${percentage}%` }}></div>
                  <div className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-500" style={{ width: `${percentage}%` }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground/60">
            <Link2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p>No outbound link clicks tracked yet</p>
            <p className="text-xs mt-1 text-muted-foreground/40">
              Clicks on external links will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

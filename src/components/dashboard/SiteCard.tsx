import { Link } from "react-router-dom";
import { Site } from "@/hooks/useSites";
import { Globe, Copy, Check, BarChart2, TrendingUp, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsStats, useAnalyticsTimeSeries } from "@/hooks/useAnalytics";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SiteCardProps {
  site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Fetch stats for the last 30 days
  const { data: stats } = useAnalyticsStats({ siteId: site.id, dateRange: "30d" });
  const { data: timeSeries } = useAnalyticsTimeSeries({ siteId: site.id, dateRange: "30d" });

  const copyTrackingId = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigator.clipboard.writeText(site.tracking_id);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Tracking ID copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const hasData = stats && stats.totalPageviews > 0;
  const isTrendingUp = (stats?.visitorsChange || 0) >= 0;

  return (
    <Link to={`/dashboard/sites/${site.id}`}>
      <Card className="hover:shadow-2xl transition-all duration-500 border-border/60 bg-card hover:border-primary/20 group cursor-pointer relative overflow-hidden h-full flex flex-col hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none tracking-tight group-hover:text-primary transition-colors">
                {site.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {site.domain && (
                  <span className="text-xs text-muted-foreground truncate max-w-[140px] font-mono">
                    {site.domain}
                  </span>
                )}
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-normal bg-muted/50 border-border/50">
                  {site.timezone}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyTrackingId}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-end relative z-10 pt-6">
          {hasData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Visitors (30d)</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {stats?.uniqueVisitors.toLocaleString()}
                  </p>
                  {stats?.visitorsChange !== undefined && (
                    <div className={`flex items-center text-xs mt-1.5 font-medium ${isTrendingUp ? 'text-green-500' : 'text-red-500'}`}>
                      <TrendingUp className={`h-3 w-3 mr-1 ${!isTrendingUp && 'rotate-180'}`} />
                      <span>{Math.abs(stats.visitorsChange).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Pageviews</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.totalPageviews.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="h-20 w-[calc(100%+3rem)] -mx-6 -mb-6 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id={`gradient-${site.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill={`url(#gradient-${site.id})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed border-border mx-1">
              <div className="p-3 bg-muted/50 rounded-full mb-3">
                <BarChart2 className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No data yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add script to track</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

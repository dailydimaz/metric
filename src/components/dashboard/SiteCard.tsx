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
      <Card className="hover:shadow-xl transition-all duration-300 border-border/50 bg-card hover:border-primary/20 group cursor-pointer relative overflow-hidden h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none tracking-tight group-hover:text-primary transition-colors">
                {site.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {site.domain && (
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {site.domain}
                  </span>
                )}
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-normal">
                  {site.timezone}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-background/80"
            onClick={copyTrackingId}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-end relative z-10 pt-4">
          {hasData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Visitors (30d)</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {stats?.uniqueVisitors.toLocaleString()}
                  </p>
                  {stats?.visitorsChange !== undefined && (
                    <div className={`flex items-center text-xs mt-1 ${isTrendingUp ? 'text-green-500' : 'text-red-500'}`}>
                      <TrendingUp className={`h-3 w-3 mr-1 ${!isTrendingUp && 'rotate-180'}`} />
                      <span>{Math.abs(stats.visitorsChange).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Pageviews</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {stats?.totalPageviews.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="h-16 w-full opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id={`gradient-${site.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill={`url(#gradient-${site.id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="p-3 bg-muted/50 rounded-full mb-3">
                <BarChart2 className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No data received yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add script to start capturing</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
              ID: {site.tracking_id}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">
              Open Dashboard <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

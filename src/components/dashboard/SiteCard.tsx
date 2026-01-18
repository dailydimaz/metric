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
      <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-primary/20 h-full flex flex-col">
        {/* Hover Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="relative z-10 flex flex-row items-start justify-between pb-2 space-y-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Globe className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xl leading-none tracking-tight group-hover:text-primary transition-colors">
                {site.name}
              </h3>
              <div className="flex items-center gap-2">
                {site.domain && (
                  <span className="text-xs text-muted-foreground truncate max-w-[150px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                    {site.domain}
                  </span>
                )}
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-border bg-background/50 backdrop-blur-sm">
                  {site.timezone}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
              onClick={copyTrackingId}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex-1 flex flex-col justify-end pt-4">
          {hasData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visitors</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.uniqueVisitors.toLocaleString()}
                  </p>
                  {stats?.visitorsChange !== undefined && (
                    <div className={`flex items-center text-xs font-medium ${isTrendingUp ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-600 bg-red-500/10'} w-fit px-1.5 py-0.5 rounded-full`}>
                      <TrendingUp className={`h-3 w-3 mr-1 ${!isTrendingUp && 'rotate-180'}`} />
                      <span>{Math.abs(stats.visitorsChange).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pageviews</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.totalPageviews.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="h-24 w-[calc(100%+3rem)] -mx-6 -mb-6 opacity-50 group-hover:opacity-80 transition-opacity duration-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id={`gradient-${site.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
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
            <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-xl border border-dashed border-border/60 mx-1 group-hover:bg-muted/50 transition-colors">
              <div className="p-3 bg-background rounded-full mb-3 shadow-sm ring-1 ring-border/50">
                <BarChart2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add script to start tracking</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

import { Eye, Users, Clock, MousePointerClick, TrendingUp, TrendingDown } from "lucide-react";
import { StatsData } from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: StatsData | undefined;
  isLoading: boolean;
  visibleMetrics?: string[];
  showComparison?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  desc?: string;
  isLoading: boolean;
  showComparison?: boolean;
  isInverse?: boolean;
}

function StatCard({ title, value, change, icon, desc, isLoading, showComparison = true, isInverse }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  // For standard metrics (views, visitors, etc.), positive change is Good (Green).
  // For inverse metrics (bounce rate), positive change is Bad (Red).
  // Default is standard. If isInverse is true, we flip the logic.

  const isGood = isInverse ? !isPositive : isPositive;
  const trendColor = isGood ? 'text-emerald-500' : 'text-rose-500';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="p-5 rounded-xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        {!isLoading && change !== undefined && showComparison && (
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-5 font-semibold",
            isGood ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" : "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="h-8 w-24 bg-muted/20 animate-pulse rounded-md"></div>
        ) : (
          <div className="text-3xl font-bold tracking-tight text-foreground font-display">{value}</div>
        )}

        <div className="text-xs text-muted-foreground font-medium">{title}</div>
      </div>

      {!isLoading && desc && (
        <div className="mt-2 text-[10px] text-muted-foreground/60">{desc}</div>
      )}
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function StatsCards({ stats, isLoading, visibleMetrics, showComparison = true }: StatsCardsProps) {
  const show = (key: string) => !visibleMetrics || visibleMetrics.includes(key);

  if (visibleMetrics && visibleMetrics.length === 0) return null;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {show('pageviews') && (
        <StatCard
          title="Total Views"
          value={formatNumber(stats?.totalPageviews || 0)}
          change={stats?.pageviewsChange}
          icon={<Eye className="h-5 w-5" />}
          isLoading={isLoading}
          showComparison={showComparison}
        />
      )}
      {show('visitors') && (
        <StatCard
          title="Unique Visitors"
          value={formatNumber(stats?.uniqueVisitors || 0)}
          change={stats?.visitorsChange}
          icon={<Users className="h-5 w-5" />}
          isLoading={isLoading}
          showComparison={showComparison}
        />
      )}
      {show('bounce_rate') && (
        <StatCard
          title="Bounce Rate"
          value={`${(stats?.bounceRate || 0).toFixed(1)}%`}
          desc="Single page sessions"
          icon={<MousePointerClick className="h-5 w-5" />}
          isLoading={isLoading}
          showComparison={showComparison}
          isInverse={true}
        />
      )}
      {show('avg_duration') && (
        <StatCard
          title="Avg. Session"
          value={stats?.avgSessionDuration ? `${Math.round(stats.avgSessionDuration)}s` : "—"}
          desc="Time spent on site"
          icon={<Clock className="h-5 w-5" />}
          isLoading={isLoading}
          showComparison={showComparison}
        />
      )}
    </div>
  );
}


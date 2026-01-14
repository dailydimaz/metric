import { Eye, Users, Clock, MousePointerClick, TrendingUp, TrendingDown } from "lucide-react";
import { StatsData } from "@/hooks/useAnalytics";

interface StatsCardsProps {
  stats: StatsData | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  desc?: string;
  isLoading: boolean;
}

function StatCard({ title, value, change, icon, desc, isLoading }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl">
      <div className="stat-figure text-primary bg-primary/10 p-2 rounded-xl">
        {icon}
      </div>
      <div className="stat-title font-medium opacity-70">{title}</div>
      {isLoading ? (
        <div className="skeleton h-8 w-24 my-1"></div>
      ) : (
        <div className="stat-value text-3xl font-bold tracking-tight">{value}</div>
      )}

      {!isLoading && change !== undefined && (
        <div className={`stat-desc flex items-center gap-1 font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{Math.abs(change).toFixed(1)}%</span>
          <span className="text-base-content/40 font-normal ml-1">vs last period</span>
        </div>
      )}
      {!isLoading && desc && (
        <div className="stat-desc text-base-content/40">{desc}</div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function StatsCards({ stats, isLoading, visibleMetrics }: StatsCardsProps & { visibleMetrics?: string[] }) {
  const show = (key: string) => !visibleMetrics || visibleMetrics.includes(key);

  if (visibleMetrics && visibleMetrics.length === 0) return null;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {show('pageviews') && (
        <StatCard
          title="Total Views"
          value={formatNumber(stats?.totalPageviews || 0)}
          change={stats?.pageviewsChange}
          icon={<Eye className="h-6 w-6" />}
          isLoading={isLoading}
        />
      )}
      {show('visitors') && (
        <StatCard
          title="Unique Visitors"
          value={formatNumber(stats?.uniqueVisitors || 0)}
          change={stats?.visitorsChange}
          icon={<Users className="h-6 w-6" />}
          isLoading={isLoading}
        />
      )}
      {show('bounce_rate') && (
        <StatCard
          title="Bounce Rate"
          value={`${(stats?.bounceRate || 0).toFixed(1)}%`}
          desc="Single page sessions"
          icon={<MousePointerClick className="h-6 w-6" />}
          isLoading={isLoading}
        />
      )}
      {show('avg_duration') && (
        <StatCard
          title="Avg. Session"
          value={stats?.avgSessionDuration ? `${Math.round(stats.avgSessionDuration)}s` : "—"}
          desc="Time spent on site"
          icon={<Clock className="h-6 w-6" />}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}


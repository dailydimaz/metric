import { Eye, Users, Clock, MousePointerClick, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
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
  index?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

function StatCard({ title, value, change, icon, desc, isLoading, showComparison = true, isInverse, index = 0 }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const isGood = isInverse ? !isPositive : isPositive;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="p-5 rounded-xl border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-default group">
        <div className="flex justify-between items-start mb-3">
          <motion.div 
            className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
          >
            {icon}
          </motion.div>
          {!isLoading && change !== undefined && showComparison && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-5 font-semibold",
                isGood ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" : "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
              )}>
                {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(change).toFixed(1)}%
              </Badge>
            </motion.div>
          )}
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="h-8 w-24 bg-muted/20 animate-pulse rounded-md"></div>
          ) : (
            <motion.div 
              className="text-3xl font-bold tracking-tight text-foreground font-display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              {value}
            </motion.div>
          )}

          <div className="text-xs text-muted-foreground font-medium">{title}</div>
        </div>

        {!isLoading && desc && (
          <motion.div 
            className="mt-2 text-[10px] text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            {desc}
          </motion.div>
        )}
      </Card>
    </motion.div>
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

  let cardIndex = 0;
  
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
          index={cardIndex++}
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
          index={cardIndex++}
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
          index={cardIndex++}
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
          index={cardIndex++}
        />
      )}
    </div>
  );
}


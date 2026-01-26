import { useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { TimeSeriesData } from "@/hooks/useAnalytics";
import { format, parseISO } from "date-fns";
import { LineChart, ZoomIn, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface VisitorChartProps {
  data: TimeSeriesData[] | undefined;
  isLoading: boolean;
  showComparison?: boolean;
  onDateClick?: (date: string) => void;
}

const chartConfig = {
  pageviews: {
    label: "Pageviews",
    color: "hsl(var(--primary))",
  },
  visitors: {
    label: "Unique Visitors",
    color: "hsl(var(--chart-2))",
  },
  prevPageviews: {
    label: "Previous Pageviews",
    color: "hsl(var(--primary))",
  },
  prevVisitors: {
    label: "Previous Visitors",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function VisitorChart({ data, isLoading, showComparison = true, onDateClick }: VisitorChartProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedDate = data.activePayload[0].payload.date;
      setSelectedDate(clickedDate);
      onDateClick?.(clickedDate);
    }
  }, [onDateClick]);

  const clearSelection = () => {
    setSelectedDate(null);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <LineChart className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">Traffic Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const chartData = data?.map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <motion.div 
              className="p-2 bg-primary/10 rounded-lg text-primary"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <LineChart className="h-4 w-4" />
            </motion.div>
            <CardTitle className="text-base font-semibold">Traffic Overview</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary" className="gap-1">
                    <ZoomIn className="h-3 w-3" />
                    {format(parseISO(selectedDate), "MMM d, yyyy")}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={clearSelection}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            {onDateClick && !selectedDate && (
              <span className="text-xs text-muted-foreground">Click chart to filter</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={handleClick}
              style={{ cursor: onDateClick ? 'pointer' : 'default' }}
              accessibilityLayer
            >
              <defs>
                <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pageviews)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-pageviews)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '4 4' }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="pageviews"
                stroke="var(--color-pageviews)"
                fillOpacity={1}
                fill="url(#colorPageviews)"
                strokeWidth={2.5}
                animationDuration={1200}
                animationEasing="ease-out"
                dot={false}
                activeDot={{ 
                  r: 6, 
                  strokeWidth: 2, 
                  stroke: 'hsl(var(--background))',
                }}
              />
              {showComparison && (
                <Area
                  type="monotone"
                  dataKey="prevPageviews"
                  stroke="var(--color-prevPageviews)"
                  strokeDasharray="4 4"
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  animationDuration={1200}
                />
              )}
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="var(--color-visitors)"
                fillOpacity={1}
                fill="url(#colorVisitors)"
                strokeWidth={2.5}
                animationDuration={1200}
                animationEasing="ease-out"
                dot={false}
                activeDot={{ 
                  r: 6, 
                  strokeWidth: 2, 
                  stroke: 'hsl(var(--background))',
                }}
              />
              {showComparison && (
                <Area
                  type="monotone"
                  dataKey="prevVisitors"
                  stroke="var(--color-prevVisitors)"
                  strokeDasharray="4 4"
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  animationDuration={1200}
                />
              )}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

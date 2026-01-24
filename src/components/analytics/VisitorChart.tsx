import { useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { TimeSeriesData } from "@/hooks/useAnalytics";
import { format, parseISO } from "date-fns";
import { LineChart, ZoomIn, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VisitorChartProps {
  data: TimeSeriesData[] | undefined;
  isLoading: boolean;
  showComparison?: boolean;
  onDateClick?: (date: string) => void;
}

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
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onClick={handleClick}
                style={{ cursor: onDateClick ? 'pointer' : 'default' }}
              >
                <defs>
                  <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, opacity: 0.6 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, opacity: 0.6 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.2)',
                    color: 'hsl(var(--foreground))',
                    padding: '12px 16px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ 
                    stroke: 'hsl(var(--primary))', 
                    strokeWidth: 2, 
                    opacity: 0.3,
                    strokeDasharray: '4 4'
                  }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '20px' }}
                />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  name="Pageviews"
                  stroke="hsl(var(--primary))"
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
                    fill: 'hsl(var(--primary))'
                  }}
                />
                {showComparison && (
                  <Area
                    type="monotone"
                    dataKey="prevPageviews"
                    name="Previous Pageviews"
                    stroke="hsl(var(--primary))"
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
                  name="Unique Visitors"
                  stroke="hsl(var(--chart-2))"
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
                    fill: 'hsl(var(--chart-2))'
                  }}
                />
                {showComparison && (
                  <Area
                    type="monotone"
                    dataKey="prevVisitors"
                    name="Previous Visitors"
                    stroke="hsl(var(--chart-2))"
                    strokeDasharray="4 4"
                    fillOpacity={0}
                    strokeWidth={2}
                    strokeOpacity={0.3}
                    animationDuration={1200}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


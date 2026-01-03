import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TimeSeriesData } from "@/hooks/useAnalytics";
import { format, parseISO } from "date-fns";
import { LineChart } from "lucide-react";

interface VisitorChartProps {
  data: TimeSeriesData[] | undefined;
  isLoading: boolean;
}

export function VisitorChart({ data, isLoading }: VisitorChartProps) {
  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="flex items-center gap-2 p-4 border-b border-base-200">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <LineChart className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base">Traffic Overview</h3>
          </div>
          <div className="p-6">
            <div className="skeleton h-[300px] w-full rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data?.map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  })) || [];

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-0">
        <div className="flex items-center gap-2 p-4 border-b border-base-200">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <LineChart className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-base">Traffic Overview</h3>
        </div>

        <div className="p-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--p))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--p))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--s))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--s))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--b3))" opacity={0.5} />
              <XAxis
                dataKey="displayDate"
                tick={{ fill: 'hsl(var(--bc))', fontSize: 12, opacity: 0.6 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--bc))', fontSize: 12, opacity: 0.6 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--b1))',
                  borderColor: 'hsl(var(--b3))',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: 'hsl(var(--bc))'
                }}
                itemStyle={{ color: 'hsl(var(--bc))' }}
                cursor={{ stroke: 'hsl(var(--bc))', strokeWidth: 1, opacity: 0.2 }}
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
                stroke="hsl(var(--p))"
                fillOpacity={1}
                fill="url(#colorPageviews)"
                strokeWidth={2}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                name="Unique Visitors"
                stroke="hsl(var(--s))"
                fillOpacity={1}
                fill="url(#colorVisitors)"
                strokeWidth={2}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


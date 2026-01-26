import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface RetentionChartProps {
  data: { day: number; retained: number; rate: number }[] | undefined;
  isLoading?: boolean;
}

const chartConfig = {
  rate: {
    label: "Retention Rate",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function RetentionChart({ data, isLoading }: RetentionChartProps) {
  if (isLoading) {
    return <div className="h-64 w-full animate-pulse bg-muted rounded-lg" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No retention data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[256px] w-full">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `D${value}`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value}%`}
          domain={[0, 100]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => `Day ${value}`}
              formatter={(value) => [`${value}%`, "Retention"]}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="var(--color-rate)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-rate)', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

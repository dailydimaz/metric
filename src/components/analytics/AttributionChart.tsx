import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { AttributionChannel } from '@/hooks/useAttribution';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface AttributionChartProps {
  firstTouch: AttributionChannel[];
  lastTouch: AttributionChannel[];
}

const chartConfig = {
  conversions: {
    label: "Conversions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AttributionChart({ firstTouch, lastTouch }: AttributionChartProps) {
  const formatData = (data: AttributionChannel[]) => {
    return data.slice(0, 8).map((item, index) => ({
      name: item.channel,
      conversions: item.conversions,
      medium: item.medium,
      fill: COLORS[index % COLORS.length],
    }));
  };

  const renderChart = (data: AttributionChannel[]) => {
    const chartData = formatData(data);
    
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No conversion data available
        </div>
      );
    }

    return (
      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100} 
            tickLine={false} 
            axisLine={false}
            tick={{ fontSize: 12 }} 
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.payload.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Medium: {item.payload.medium}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {value} conversions
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attribution by Channel</CardTitle>
        <CardDescription>
          Compare first-touch vs last-touch attribution models
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="first-touch">
          <TabsList className="mb-4">
            <TabsTrigger value="first-touch">
              First Touch
              <Badge variant="secondary" className="ml-2">
                {firstTouch.reduce((sum, c) => sum + c.conversions, 0)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="last-touch">
              Last Touch
              <Badge variant="secondary" className="ml-2">
                {lastTouch.reduce((sum, c) => sum + c.conversions, 0)}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="first-touch">
            <p className="text-sm text-muted-foreground mb-4">
              Credit goes to the first channel that brought the visitor
            </p>
            {renderChart(firstTouch)}
          </TabsContent>
          <TabsContent value="last-touch">
            <p className="text-sm text-muted-foreground mb-4">
              Credit goes to the last channel before conversion
            </p>
            {renderChart(lastTouch)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

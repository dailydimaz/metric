import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AttributionChannel } from '@/hooks/useAttribution';

interface AttributionChartProps {
  firstTouch: AttributionChannel[];
  lastTouch: AttributionChannel[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AttributionChart({ firstTouch, lastTouch }: AttributionChartProps) {
  const formatData = (data: AttributionChannel[]) => {
    return data.slice(0, 8).map((item) => ({
      name: item.channel,
      conversions: item.conversions,
      medium: item.medium,
    }));
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">Medium: {data.medium}</p>
          <p className="text-sm font-medium text-primary">
            {data.conversions} conversions
          </p>
        </div>
      );
    }
    return null;
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
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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

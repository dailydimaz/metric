import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Target, Users, TrendingUp, Route } from 'lucide-react';
import { AttributionData } from '@/hooks/useAttribution';

interface AttributionStatsProps {
  data: AttributionData;
}

export function AttributionStats({ data }: AttributionStatsProps) {
  const { summary, campaigns, paths } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">{summary?.total_conversions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Converting Visitors</p>
                <p className="text-2xl font-bold">{summary?.converting_visitors || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Channel</p>
                <p className="text-2xl font-bold">
                  {data.firstTouch?.[0]?.channel || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Route className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Channels</p>
                <p className="text-2xl font-bold">{data.firstTouch?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      {campaigns && campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Conversions attributed to your marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{campaign.campaign}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.source || 'Direct'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{campaign.medium || 'None'}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {campaign.conversions}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Conversion Paths */}
      {paths && paths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Conversion Paths</CardTitle>
            <CardDescription>
              Multi-touch attribution showing the journey to conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paths.map((pathItem, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {pathItem.path.split(' → ').map((step, stepIdx, arr) => (
                        <div key={stepIdx} className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-medium">
                            {step}
                          </Badge>
                          {stepIdx < arr.length - 1 && (
                            <span className="text-muted-foreground">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Avg. {pathItem.avg_touchpoints} touchpoints
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{pathItem.conversions}</p>
                    <p className="text-sm text-muted-foreground">conversions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { usePublicDashboardData } from '@/hooks/usePublicDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Eye, Globe, Monitor, FileText, Link } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PublicDashboardStats {
  site_name: string;
  title: string | null;
  visitors: { total: number; pageviews: number } | null;
  top_pages: Array<{ url: string; pageviews: number; unique_visitors: number }> | null;
  top_referrers: Array<{ referrer: string; visits: number }> | null;
  devices: { browsers: Array<{ name: string; count: number }>; os: Array<{ name: string; count: number }> } | null;
  geo: Array<{ country: string; visits: number }> | null;
}

export default function PublicDashboard() {
  const { token } = useParams<{ token: string }>();
  const [range, setRange] = useState('7d');

  const getDateRange = () => {
    const end = new Date();
    let start: Date;

    switch (range) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      default:
        start = subDays(end, 7);
    }

    return {
      start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
      end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
    };
  };

  const { data: rawData, isLoading, error } = usePublicDashboardData(token, getDateRange());
  const data = rawData as unknown as PublicDashboardStats | null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard Not Found</h2>
            <p className="text-muted-foreground">
              This dashboard doesn't exist or has been disabled by its owner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxPageviews = data.top_pages ? Math.max(...data.top_pages.map((p: any) => p.pageviews)) : 0;
  const maxReferrerVisits = data.top_referrers ? Math.max(...data.top_referrers.map((r: any) => r.visits)) : 0;
  const maxGeoVisits = data.geo ? Math.max(...data.geo.map((g: any) => g.visits)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{data.title || data.site_name}</h1>
            <p className="text-muted-foreground">Public Analytics Dashboard</p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        {data.visitors && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.visitors.total?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.visitors.pageviews?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          {data.top_pages && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.top_pages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No page data available</p>
                ) : (
                  data.top_pages.map((page: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate max-w-[200px]" title={page.url}>
                          {page.url}
                        </span>
                        <span className="text-muted-foreground">{page.pageviews}</span>
                      </div>
                      <Progress value={(page.pageviews / maxPageviews) * 100} className="h-1.5" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Referrers */}
          {data.top_referrers && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.top_referrers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No referrer data available</p>
                ) : (
                  data.top_referrers.map((ref: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate max-w-[200px]" title={ref.referrer}>
                          {ref.referrer}
                        </span>
                        <span className="text-muted-foreground">{ref.visits}</span>
                      </div>
                      <Progress value={(ref.visits / maxReferrerVisits) * 100} className="h-1.5" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Devices */}
          {data.devices && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Browsers</h4>
                    <div className="space-y-2">
                      {data.devices.browsers?.map((b: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{b.name}</span>
                          <span className="text-muted-foreground">{b.count}</span>
                        </div>
                      )) || <p className="text-muted-foreground text-sm">No data</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Operating Systems</h4>
                    <div className="space-y-2">
                      {data.devices.os?.map((o: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{o.name}</span>
                          <span className="text-muted-foreground">{o.count}</span>
                        </div>
                      )) || <p className="text-muted-foreground text-sm">No data</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Geography */}
          {data.geo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Countries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.geo.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No geographic data available</p>
                ) : (
                  data.geo.map((geo: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{geo.country}</span>
                        <span className="text-muted-foreground">{geo.visits}</span>
                      </div>
                      <Progress value={(geo.visits / maxGeoVisits) * 100} className="h-1.5" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Powered by MMMetric Analytics
        </div>
      </div>
    </div>
  );
}

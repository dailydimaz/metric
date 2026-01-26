import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { sanitizeCSS } from '@/lib/cssSanitizer';
import { format, subDays } from 'date-fns';
import { usePublicDashboardData } from '@/hooks/usePublicDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Eye, Globe, Monitor, FileText, Link, Lock, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TimeseriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

interface PublicDashboardStats {
  site_name: string;
  brand_color?: string;
  brand_logo_url?: string;
  custom_css?: string;
  remove_branding?: boolean;
  title: string | null;
  password_required: boolean;
  visitors: number | null;
  pageviews: number | null;
  timeseries: TimeseriesPoint[] | null;
  top_pages: Array<{ url: string; pageviews: number; unique_visitors: number }> | null;
  top_referrers: Array<{ referrer: string; visits: number; percentage: number }> | null;
  devices: {
    device_types: Array<{ device_type: string; count: number }>;
    browsers: Array<{ browser: string; count: number }>;
  } | null;
  countries: Array<{ country: string; visits: number }> | null;
}

export default function PublicDashboard() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';

  const [range, setRange] = useState('7d');
  const [password, setPassword] = useState('');
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>();

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
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    };
  };

  const { data: rawData, isLoading, error } = usePublicDashboardData(token, getDateRange(), submittedPassword);
  const data = rawData as unknown as PublicDashboardStats | null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedPassword(password);
  };

  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Clean up any previously injected style
    if (styleRef.current) {
      styleRef.current.remove();
      styleRef.current = null;
    }

    if (data?.custom_css) {
      try {
        // Sanitize CSS before injection to prevent CSS injection attacks
        const sanitizedCSS = sanitizeCSS(data.custom_css);
        if (sanitizedCSS) {
          const style = document.createElement('style');
          style.textContent = sanitizedCSS;
          document.head.appendChild(style);
          styleRef.current = style;
        }
      } catch (e) {
        console.error('Failed to inject custom CSS', e);
      }
    }

    // Cleanup on unmount
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [data?.custom_css]);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${isEmbed ? 'p-4' : ''}`}>
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${isEmbed ? 'p-4' : ''}`}>
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

  // Password required
  if (data.password_required) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${isEmbed ? 'p-4' : ''}`}>
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Password Protected</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter password to view this dashboard</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoFocus
                />
              </div>
              {submittedPassword && (
                <p className="text-sm text-destructive">Incorrect password. Please try again.</p>
              )}
              <Button type="submit" className="w-full">
                View Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxPageviews = data.top_pages ? Math.max(...data.top_pages.map((p) => p.pageviews)) : 0;
  const maxReferrerVisits = data.top_referrers ? Math.max(...data.top_referrers.map((r) => r.visits)) : 0;
  const maxGeoVisits = data.countries ? Math.max(...data.countries.map((g) => g.visits)) : 0;

  // Format timeseries data for chart
  const chartData = data.timeseries?.map((point) => ({
    date: format(new Date(point.date), 'MMM d'),
    Visitors: point.visitors,
    Pageviews: point.pageviews,
  })) || [];

  return (
    <div className={`min-h-screen bg-background ${isEmbed ? '' : ''}`}>
      <div className={`container mx-auto px-4 py-8 ${isEmbed ? 'max-w-full' : 'max-w-6xl'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {data.brand_logo_url && (
              <img src={data.brand_logo_url} alt="Logo" className="h-10 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: data.brand_color }}>{data.title || data.site_name}</h1>
              {!isEmbed && <p className="text-muted-foreground">Public Analytics Dashboard</p>}
            </div>
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
        {(data.visitors !== null || data.pageviews !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {data.visitors !== null && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.visitors.toLocaleString()}</div>
                </CardContent>
              </Card>
            )}
            {data.pageviews !== null && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.pageviews.toLocaleString()}</div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Timeseries Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Visitor Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Visitors"
                      stroke={data.brand_color || "hsl(var(--primary))"}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Pageviews"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
                  data.top_pages.map((page, i) => (
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
                  data.top_referrers.map((ref, i) => (
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
                    <h4 className="text-sm font-medium mb-2">Device Types</h4>
                    <div className="space-y-2">
                      {data.devices.device_types?.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="capitalize">{d.device_type || 'Unknown'}</span>
                          <span className="text-muted-foreground">{d.count}</span>
                        </div>
                      )) || <p className="text-muted-foreground text-sm">No data</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Browsers</h4>
                    <div className="space-y-2">
                      {data.devices.browsers?.map((b, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{b.browser || 'Unknown'}</span>
                          <span className="text-muted-foreground">{b.count}</span>
                        </div>
                      )) || <p className="text-muted-foreground text-sm">No data</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Geography */}
          {data.countries && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Countries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.countries.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No geographic data available</p>
                ) : (
                  data.countries.map((geo, i) => (
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
        {!isEmbed && !data.remove_branding && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            Powered by MMMetric Analytics
          </div>
        )}
      </div>
    </div>
  );
}
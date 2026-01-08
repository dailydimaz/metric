import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { usePublicDashboard } from '@/hooks/usePublicDashboard';
import { useSites } from '@/hooks/useSites';
import { Copy, RefreshCw, ExternalLink, Share2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PublicDashboardCard() {
  const { toast } = useToast();
  const { sites } = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const { config, isLoading, createOrUpdate, regenerateToken } = usePublicDashboard(selectedSiteId);

  const [isEnabled, setIsEnabled] = useState(false);
  const [title, setTitle] = useState('');
  const [showVisitors, setShowVisitors] = useState(true);
  const [showPageviews, setShowPageviews] = useState(true);
  const [showTopPages, setShowTopPages] = useState(true);
  const [showReferrers, setShowReferrers] = useState(true);
  const [showDevices, setShowDevices] = useState(false);
  const [showGeo, setShowGeo] = useState(false);

  // Set default site on load
  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  // Update form when config loads
  useEffect(() => {
    if (config) {
      setIsEnabled(config.is_enabled);
      setTitle(config.title || '');
      setShowVisitors(config.show_visitors);
      setShowPageviews(config.show_pageviews);
      setShowTopPages(config.show_top_pages);
      setShowReferrers(config.show_referrers);
      setShowDevices(config.show_devices);
      setShowGeo(config.show_geo);
    } else {
      // Reset to defaults when no config
      setIsEnabled(false);
      setTitle('');
      setShowVisitors(true);
      setShowPageviews(true);
      setShowTopPages(true);
      setShowReferrers(true);
      setShowDevices(false);
      setShowGeo(false);
    }
  }, [config]);

  const shareUrl = config?.share_token
    ? `${window.location.origin}/share/${config.share_token}`
    : null;

  const handleSave = () => {
    createOrUpdate.mutate({
      is_enabled: isEnabled,
      title: title || null,
      show_visitors: showVisitors,
      show_pageviews: showPageviews,
      show_top_pages: showTopPages,
      show_referrers: showReferrers,
      show_devices: showDevices,
      show_geo: showGeo,
    });
  };

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Copied!',
        description: 'Share URL copied to clipboard.',
      });
    }
  };

  if (sites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Public Dashboard
          </CardTitle>
          <CardDescription>Share your analytics with a public URL</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Create a site first to enable public dashboards.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Public Dashboard
        </CardTitle>
        <CardDescription>Share your analytics with a secure public URL</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Site selector */}
        <div className="space-y-2">
          <Label>Select Site</Label>
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Public Dashboard</Label>
                <p className="text-sm text-muted-foreground">
                  Allow anyone with the link to view your stats
                </p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>

            {/* Share URL */}
            {shareUrl && (
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => regenerateToken.mutate()}
                    disabled={regenerateToken.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 ${regenerateToken.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click the refresh button to generate a new URL (old URL will stop working)
                </p>
              </div>
            )}

            {/* Custom title */}
            <div className="space-y-2">
              <Label>Dashboard Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Leave empty to use site name"
              />
            </div>

            {/* Visible sections */}
            <div className="space-y-3">
              <Label>Visible Sections</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-visitors"
                    checked={showVisitors}
                    onCheckedChange={(checked) => setShowVisitors(!!checked)}
                  />
                  <label htmlFor="show-visitors" className="text-sm">
                    Visitors Count
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-pageviews"
                    checked={showPageviews}
                    onCheckedChange={(checked) => setShowPageviews(!!checked)}
                  />
                  <label htmlFor="show-pageviews" className="text-sm">
                    Page Views
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-pages"
                    checked={showTopPages}
                    onCheckedChange={(checked) => setShowTopPages(!!checked)}
                  />
                  <label htmlFor="show-pages" className="text-sm">
                    Top Pages
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-referrers"
                    checked={showReferrers}
                    onCheckedChange={(checked) => setShowReferrers(!!checked)}
                  />
                  <label htmlFor="show-referrers" className="text-sm">
                    Top Referrers
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-devices"
                    checked={showDevices}
                    onCheckedChange={(checked) => setShowDevices(!!checked)}
                  />
                  <label htmlFor="show-devices" className="text-sm">
                    Devices
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-geo"
                    checked={showGeo}
                    onCheckedChange={(checked) => setShowGeo(!!checked)}
                  />
                  <label htmlFor="show-geo" className="text-sm">
                    Countries
                  </label>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={createOrUpdate.isPending} className="w-full">
              {createOrUpdate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

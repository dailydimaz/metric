import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bookmark, Copy, ExternalLink, CheckCircle, Code, Layers } from "lucide-react";
import { useSites } from "@/hooks/useSites";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const OVERLAY_SCRIPT_URL = "https://mmmetric.lovable.app/overlay.js";

export default function PageOverlay() {
  const [searchParams] = useSearchParams();
  const initialSiteId = searchParams.get("site") || "";
  
  const { sites, isLoading } = useSites();
  const { toast } = useToast();
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const selectedSite = sites.find(s => s.id === selectedSiteId);
  const trackingId = selectedSite?.tracking_id || "YOUR_TRACKING_ID";

  // Generate bookmarklet code
  const bookmarkletCode = `javascript:(function(){
  if(window._mmOverlayActive){alert('mmmetric overlay is already active');return;}
  var s=document.createElement('script');
  s.src='${OVERLAY_SCRIPT_URL}?cb='+Date.now();
  s.onerror=function(){alert('Failed to load mmmetric overlay');};
  document.body.appendChild(s);
})();`.replace(/\n/g, '').replace(/\s+/g, ' ');

  // Generate URL with tracking ID for sites without the script installed
  const getOverlayUrl = (siteUrl: string) => {
    const url = new URL(siteUrl);
    url.searchParams.set("mm_tracking_id", trackingId);
    return url.toString();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, label)}
      className="gap-2"
    >
      {copiedItem === label ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copiedItem === label ? "Copied!" : "Copy"}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Layers className="h-8 w-8 text-primary" />
                Page Overlay
              </h1>
              <p className="text-muted-foreground mt-2">
                View real-time analytics directly on your live website with an overlay widget.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
        </motion.div>

        {/* Site Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Site</CardTitle>
              <CardDescription>
                Choose a site to generate overlay instructions for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder={isLoading ? "Loading sites..." : "Select a site"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} {site.domain && `(${site.domain})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSite && (
                  <p className="text-xs text-muted-foreground">
                    Tracking ID: <code className="bg-muted px-1 py-0.5 rounded">{trackingId}</code>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Installation Methods */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installation</CardTitle>
              <CardDescription>
                Choose how you want to access the page overlay on your site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bookmarklet" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bookmarklet" className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Bookmarklet
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    URL Parameter
                  </TabsTrigger>
                  <TabsTrigger value="script" className="gap-2">
                    <Code className="h-4 w-4" />
                    Script Tag
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bookmarklet" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Drag to Bookmarks Bar</h4>
                    <p className="text-sm text-muted-foreground">
                      Drag the button below to your browser's bookmarks bar. Then click it while viewing any page on your site to activate the overlay.
                    </p>
                    
                    <div className="flex justify-center py-6">
                      <a
                        href={bookmarkletCode}
                        className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing inline-flex items-center gap-2"
                        onClick={(e) => e.preventDefault()}
                        draggable="true"
                        title="Drag me to your bookmarks bar"
                      >
                        <Layers className="h-5 w-5" />
                        mmmetric Overlay
                      </a>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                      ↑ Drag this button to your bookmarks bar
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Or copy the bookmarklet code:</Label>
                      <CopyButton text={bookmarkletCode} label="Bookmarklet" />
                    </div>
                    <Textarea
                      readOnly
                      value={bookmarkletCode}
                      className="font-mono text-xs h-20"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Add URL Parameter</h4>
                    <p className="text-sm text-muted-foreground">
                      Add the <code className="bg-muted px-1 py-0.5 rounded">mm_tracking_id</code> parameter to any URL on your site, then use the bookmarklet.
                    </p>

                    {selectedSite?.domain ? (
                      <div className="space-y-2">
                        <Label>Example URL with tracking:</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={getOverlayUrl(`https://${selectedSite.domain}`)}
                            className="font-mono text-xs"
                          />
                          <CopyButton 
                            text={getOverlayUrl(`https://${selectedSite.domain}`)} 
                            label="URL" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                        Select a site above to generate a URL example.
                      </div>
                    )}

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm">
                      <p className="text-amber-700 dark:text-amber-400">
                        <strong>Note:</strong> This method is useful if you haven't installed the mmmetric tracking script yet. The overlay will still work using your tracking ID.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="script" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Load Overlay via Script</h4>
                    <p className="text-sm text-muted-foreground">
                      Add this script to your page to automatically show the overlay (useful for development).
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Script tag:</Label>
                        <CopyButton 
                          text={`<script src="${OVERLAY_SCRIPT_URL}" data-tracking-id="${trackingId}"></script>`} 
                          label="Script" 
                        />
                      </div>
                      <Textarea
                        readOnly
                        value={`<script src="${OVERLAY_SCRIPT_URL}" data-tracking-id="${trackingId}"></script>`}
                        className="font-mono text-xs h-16"
                      />
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
                      <p className="text-blue-700 dark:text-blue-400">
                        <strong>Tip:</strong> Only include this script during development. Remove it before deploying to production.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overlay Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">📊</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Real-time Stats</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      View visitors and pageviews for today, 7 days, or 30 days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">📄</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Page-specific Data</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      See stats for the current page you're viewing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">🔗</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Top Referrers</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Discover where your traffic is coming from.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm">📱</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Draggable Widget</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Move and minimize the overlay to not obstruct your view.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Copy, History, RotateCcw, ArrowRight, ExternalLink, Link as LinkIcon, Check, Plus, MousePointerClick, Cloud, Loader2, Link2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSites } from "@/hooks/useSites";
import { useLinks, useUserLinks, getShortUrl, generateSlug } from "@/hooks/useLinks";
import { isBillingEnabled } from "@/lib/billing";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getCloudUrl } from "@/lib/config";
import { Badge } from "@/components/ui/badge";

interface CampaignParams {
  website: string;
  source: string;
  medium: string;
  name: string;
  term: string;
  content: string;
}

export default function CampaignBuilder() {
  const { toast } = useToast();
  const { sites } = useSites();
  const billingEnabled = isBillingEnabled();
  const { data: userLinks, isLoading: linksLoading } = useUserLinks();
  const cloudUrl = getCloudUrl();
  
  const [params, setParams] = useState<CampaignParams>({
    website: "",
    source: "",
    medium: "",
    name: "",
    term: "",
    content: "",
  });

  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [customSlug, setCustomSlug] = useState("");
  const [createdShortLink, setCreatedShortLink] = useState<string | null>(null);

  // Use links hook for the selected site
  const { createLink } = useLinks(selectedSiteId);

  // Set default site
  useEffect(() => {
    if (sites && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  useEffect(() => {
    // Generate URL
    if (!params.website) {
      setGeneratedUrl("");
      return;
    }

    try {
      let baseUrl = params.website;
      if (!baseUrl.match(/^https?:\/\//)) {
        baseUrl = "https://" + baseUrl;
      }

      const url = new URL(baseUrl);

      if (params.source) url.searchParams.set("utm_source", params.source);
      if (params.medium) url.searchParams.set("utm_medium", params.medium);
      if (params.name) url.searchParams.set("utm_campaign", params.name);
      if (params.term) url.searchParams.set("utm_term", params.term);
      if (params.content) url.searchParams.set("utm_content", params.content);

      setGeneratedUrl(url.toString());
      // Reset created short link when URL changes
      setCreatedShortLink(null);
    } catch {
      // Invalid URL, just ignore
      setGeneratedUrl("");
    }
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopy = () => {
    if (!generatedUrl) return;

    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The campaign URL has been copied.",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShortLink = async () => {
    if (!createdShortLink) return;
    
    await navigator.clipboard.writeText(createdShortLink);
    setCopiedShort(true);
    toast({
      title: "Copied!",
      description: "Short link copied to clipboard.",
    });
    setTimeout(() => setCopiedShort(false), 2000);
  };

  const handleReset = () => {
    setParams({
      website: "",
      source: "",
      medium: "",
      name: "",
      term: "",
      content: "",
    });
    setCreatedShortLink(null);
    setCustomSlug("");
  };

  const handleCreateShortLink = async () => {
    if (!selectedSiteId || !generatedUrl) {
      toast({
        title: "Missing information",
        description: "Please select a site and generate a URL first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createLink.mutateAsync({
        siteId: selectedSiteId,
        originalUrl: generatedUrl,
        slug: customSlug.trim() || undefined,
        description: params.name ? `Campaign: ${params.name}` : undefined,
      });
      
      const shortUrl = getShortUrl(result.slug);
      setCreatedShortLink(shortUrl);
      setCustomSlug("");
      
      // Auto-copy to clipboard
      await navigator.clipboard.writeText(shortUrl);
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2000);
    } catch {
      // Error handled in hook
    }
  };

  const handleRandomSlug = () => {
    setCustomSlug(generateSlug());
  };

  const copyShortLink = async (slug: string) => {
    const shortUrl = getShortUrl(slug);
    await navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Copied!",
      description: "Short link copied to clipboard.",
    });
  };

  // Cloud-only feature gate
  if (!billingEnabled) {
    return (
      <DashboardLayout>
        <div className="container max-w-2xl py-16 animate-fade-in">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Cloud Feature</CardTitle>
              <CardDescription className="text-base">
                Campaign URL Builder with short link tracking is available on mmmetric Cloud.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create trackable campaign URLs with UTM parameters and generate short links for better analytics.
              </p>
              {cloudUrl && (
                <Button asChild>
                  <a href={cloudUrl} target="_blank" rel="noopener noreferrer">
                    Try mmmetric Cloud
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-8 space-y-8 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Campaign URL Builder</h1>
          <p className="text-muted-foreground">
            Generate custom campaign parameters and create trackable short links.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Parameters</CardTitle>
                <CardDescription>
                  Enter the details of your campaign. Fields marked with * are recommended.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL *</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://example.com"
                      className="pl-9"
                      value={params.website}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">The full website URL (e.g. https://www.example.com)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Campaign Source *</Label>
                    <Input
                      id="source"
                      name="source"
                      placeholder="google, newsletter"
                      value={params.source}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">The referrer: (e.g. google, newsletter)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medium">Campaign Medium *</Label>
                    <Input
                      id="medium"
                      name="medium"
                      placeholder="cpc, banner, email"
                      value={params.medium}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Marketing medium: (e.g. cpc, banner, email)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="summer_sale"
                    value={params.name}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">Product, promo code, or slogan (e.g. spring_sale)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Campaign Term</Label>
                    <Input
                      id="term"
                      name="term"
                      placeholder="running+shoes"
                      value={params.term}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Identify the paid keywords</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Campaign Content</Label>
                    <Input
                      id="content"
                      name="content"
                      placeholder="logolink, textlink"
                      value={params.content}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Use to differentiate ads</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t px-6 py-4">
                <Button variant="ghost" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Preview & Shortener Section */}
          <div className="lg:col-span-5 space-y-6">
            {/* Generated URL Card */}
            <Card className="overflow-hidden border-primary/20 shadow-lg transition-all duration-300">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Generated URL
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 bg-muted rounded-lg break-all font-mono text-sm min-h-[5rem] flex items-center">
                  {generatedUrl || <span className="text-muted-foreground italic">Fill in the website URL to see the result...</span>}
                </div>

                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!generatedUrl}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Full URL"}
                </Button>
              </CardContent>
            </Card>

            {/* Link Shortener Card */}
            <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  Link Shortener
                </CardTitle>
                <CardDescription>
                  Create a trackable short link for better click analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Site Selector */}
                <div className="space-y-2">
                  <Label>Select Site</Label>
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites?.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Slug Input */}
                <div className="space-y-2">
                  <Label>Custom Slug (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="my-campaign"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleRandomSlug}
                      title="Generate random slug"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                  {customSlug && (
                    <p className="text-xs text-muted-foreground">
                      Preview: {getShortUrl(customSlug)}
                    </p>
                  )}
                </div>

                {/* Create Short Link Button */}
                <Button
                  className="w-full gap-2"
                  onClick={handleCreateShortLink}
                  disabled={!generatedUrl || !selectedSiteId || createLink.isPending}
                >
                  {createLink.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Short Link
                </Button>

                {/* Created Short Link Display */}
                {createdShortLink && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        <Check className="h-3 w-3 mr-1" />
                        Created
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-sm font-mono truncate">
                        {createdShortLink}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyShortLink}
                        className="shrink-0"
                      >
                        {copiedShort ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            {generatedUrl && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Label className="mb-4 block text-muted-foreground">QR Code</Label>
                  <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(createdShortLink || generatedUrl)}`}
                      alt="Campaign QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {createdShortLink ? "QR code points to short link" : "QR code points to full URL"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5" />
                  Recent Short Links
                </CardTitle>
                <CardDescription>
                  Click to copy any link
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {linksLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : userLinks && userLinks.length > 0 ? (
                  <div className="divide-y max-h-[300px] overflow-y-auto">
                    {userLinks.slice(0, 10).map((link) => (
                      <button
                        key={link.id}
                        onClick={() => copyShortLink(link.slug)}
                        className="w-full text-left p-4 hover:bg-muted/50 transition-colors group flex items-start gap-3"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-mono text-sm truncate text-primary">{getShortUrl(link.slug)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            → {link.original_url}
                          </p>
                          {link.description && (
                            <p className="text-xs text-muted-foreground/70 truncate">
                              {link.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <MousePointerClick className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No short links yet</p>
                    <p className="text-xs mt-1">Create one above to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

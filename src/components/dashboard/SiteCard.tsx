import { Link } from "react-router-dom";
import { Site } from "@/hooks/useSites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SiteCardProps {
  site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyTrackingId = async () => {
    await navigator.clipboard.writeText(site.tracking_id);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Tracking ID copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{site.name}</CardTitle>
            {site.domain && (
              <p className="text-sm text-muted-foreground">{site.domain}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {site.timezone}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
              {site.tracking_id}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyTrackingId}
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/dashboard/sites/${site.id}`}>
              View
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
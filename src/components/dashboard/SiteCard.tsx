import { Link } from "react-router-dom";
import { Site } from "@/hooks/useSites";
import { Globe, ExternalLink, Copy, Check, BarChart2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SiteCardProps {
  site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyTrackingId = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigator.clipboard.writeText(site.tracking_id);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Tracking ID copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link to={`/dashboard/sites/${site.id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/20 group cursor-pointer relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none tracking-tight group-hover:text-primary transition-colors">
                {site.name}
              </h3>
              {site.domain && (
                <p className="text-sm text-muted-foreground mt-1">
                  {site.domain}
                </p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-xs font-normal">
            {site.timezone}
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mt-4">
            <div
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50 hover:border-border transition-colors group/code"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <code className="font-mono">
                {site.tracking_id}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-transparent"
                onClick={copyTrackingId}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                )}
              </Button>
            </div>

            <div className="flex items-center text-primary text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              View Analytics
              <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart2 className="h-4 w-4" />
              <span>No data yet</span>
            </div>
            <span className="text-xs text-muted-foreground/50">
              Updated just now
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import { ArrowRight } from "lucide-react";

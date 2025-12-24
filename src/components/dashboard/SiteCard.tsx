import { Link } from "react-router-dom";
import { Site } from "@/hooks/useSites";
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
    <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-300 group">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="card-title text-base">{site.name}</h2>
              {site.domain && (
                <p className="text-sm text-base-content/70">{site.domain}</p>
              )}
            </div>
          </div>
          <div className="badge badge-ghost text-xs">
            {site.timezone}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <code className="bg-base-200 px-2 py-1 rounded text-xs font-mono">
              {site.tracking_id}
            </code>
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={copyTrackingId}
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <Link to={`/dashboard/sites/${site.id}`} className="btn btn-ghost btn-sm gap-1">
            View
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

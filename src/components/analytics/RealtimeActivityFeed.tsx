import { formatDistanceToNow } from "date-fns";
import { Activity, Globe, MousePointer, ExternalLink, AlertCircle } from "lucide-react";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RealtimeActivityFeedProps {
  siteId: string;
}

const MAX_DISPLAYED_EVENTS = 20;

function getEventIcon(eventName: string) {
  switch (eventName) {
    case "pageview":
      return <Globe className="h-4 w-4" />;
    case "click":
      return <MousePointer className="h-4 w-4" />;
    case "outbound":
      return <ExternalLink className="h-4 w-4" />;
    case "404":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function getEventBadgeVariant(eventName: string): "default" | "secondary" | "destructive" | "outline" {
  switch (eventName) {
    case "pageview":
      return "default";
    case "click":
      return "secondary";
    case "outbound":
      return "outline";
    case "404":
      return "destructive";
    default:
      return "outline";
  }
}

export function RealtimeActivityFeed({ siteId }: RealtimeActivityFeedProps) {
  const { recentEvents, isConnected } = useRealtimeAnalytics(siteId);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
            <Activity className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Live Feed</CardTitle>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-xs font-medium text-success uppercase tracking-wider">Live</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
              <div className="loading loading-dots loading-sm mb-2 opacity-50"></div>
              <p className="text-sm">Waiting for incoming events...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {recentEvents.slice(0, MAX_DISPLAYED_EVENTS).map((event) => (
                <div
                  key={event.id}
                  className="group flex items-start gap-3 p-3 hover:bg-muted/30 transition-all border-b border-border/40 last:border-0 animate-in fade-in slide-in-from-top-1 duration-300"
                >
                  <div className={`mt-0.5 p-1.5 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                    {getEventIcon(event.event_name)}
                  </div>
                  <div className="flex-1 min-w-0 grid gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Event Name Badge */}
                        <Badge variant={getEventBadgeVariant(event.event_name)} className="h-5 px-1.5 text-[10px] uppercase">
                          {event.event_name}
                        </Badge>
                        {/* Country Flag/Name */}
                        {event.country && (
                          <span className="text-xs font-medium text-muted-foreground/80">
                            {event.country}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/50 font-mono whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* URL / Path */}
                    {event.url && (
                      <p className="text-xs font-mono text-foreground/80 truncate mt-1" title={event.url}>
                        {event.url}
                      </p>
                    )}

                    {/* Details (Browser/OS) */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mt-0.5">
                      {event.browser ?? 'Unknown browser'} • {event.device_type ?? 'Unknown device'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


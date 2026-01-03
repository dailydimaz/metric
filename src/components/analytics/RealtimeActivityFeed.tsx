import { formatDistanceToNow } from "date-fns";
import { Activity, Globe, MousePointer, ExternalLink, AlertCircle } from "lucide-react";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";

interface RealtimeActivityFeedProps {
  siteId: string;
}

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

function getEventBadgeColor(eventName: string) {
  switch (eventName) {
    case "pageview":
      return "badge-primary";
    case "click":
      return "badge-secondary";
    case "outbound":
      return "badge-accent";
    case "404":
      return "badge-error";
    default:
      return "badge-neutral";
  }
}

export function RealtimeActivityFeed({ siteId }: RealtimeActivityFeedProps) {
  const { recentEvents, isConnected } = useRealtimeAnalytics(siteId);

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div className="card-body p-0">
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isConnected ? 'bg-success/10 text-success' : 'bg-base-200'}`}>
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base">Live Feed</h3>
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
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
              <div className="loading loading-dots loading-sm mb-2"></div>
              <p className="text-sm">Waiting for incoming events...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {recentEvents.slice(0, 20).map((event) => (
                <div
                  key={event.id}
                  className="group flex items-start gap-3 p-3 hover:bg-base-50 transition-all border-b border-base-100 last:border-0 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className={`mt-0.5 p-1.5 rounded-full bg-base-200 text-base-content/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                    {getEventIcon(event.event_name)}
                  </div>
                  <div className="flex-1 min-w-0 grid gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Event Name Badge */}
                        <span className={`badge badge-sm badge-outline ${getEventBadgeColor(event.event_name)} opacity-80 group-hover:opacity-100`}>
                          {event.event_name}
                        </span>
                        {/* Country Flag/Name */}
                        {event.country && (
                          <span className="text-xs font-medium text-base-content/70">
                            {event.country}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-base-content/40 font-mono whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* URL / Path */}
                    {event.url && (
                      <p className="text-xs font-mono text-base-content/80 truncate" title={event.url}>
                        {event.url}
                      </p>
                    )}

                    {/* Details (Browser/OS) hidden by default, visible on hover often looks cleaner, keeps it minimal */}
                    <div className="flex items-center gap-2 text-[10px] text-base-content/40">
                      {event.browser} • {event.device_type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


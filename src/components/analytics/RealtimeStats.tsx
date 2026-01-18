import { Activity, Users, Globe } from "lucide-react";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RealtimeStatsProps {
  siteId: string;
}

export function RealtimeStats({ siteId }: RealtimeStatsProps) {
  const { activeVisitors, activePages, isConnected } = useRealtimeAnalytics(siteId);

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-success animate-pulse" />
            <h3 className="font-semibold text-lg">Real-time</h3>
          </div>
          <div className="flex items-center gap-2" title={isConnected ? "Connected to real-time updates" : "Establishing connection..."}>
            <span
              className={`w-2 h-2 rounded-full transition-colors ${isConnected ? 'bg-success' : 'bg-warning animate-pulse'}`}
            />
            <span className="text-xs text-muted-foreground font-medium">
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Active Visitors Count */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-4xl font-bold tracking-tight">{activeVisitors}</p>
            <p className="text-sm text-muted-foreground font-medium">Active visitors (5 min)</p>
          </div>
        </div>

        {/* Active Pages */}
        {activePages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>Active Pages</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {activePages.slice(0, 5).map((page, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm bg-muted/50 hover:bg-muted/80 transition-colors rounded-md px-3 py-2"
                >
                  <span className="truncate flex-1 font-mono text-xs text-foreground/80">{page.url}</span>
                  <Badge variant="secondary" className="ml-2 font-mono">{page.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeVisitors === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No active visitors right now
          </p>
        )}
      </CardContent>
    </Card>
  );
}

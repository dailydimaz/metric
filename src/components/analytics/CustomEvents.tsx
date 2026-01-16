import { formatDistanceToNow } from "date-fns";
import { Zap, ChevronDown, ChevronUp, BarChart2, PieChart } from "lucide-react";
import { useState } from "react";
import { useEventGroups, useCustomEvents, CustomEvent, EventGroup, useEventProperties, PropertyStats } from "@/hooks/useCustomEvents";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeState } from "@/components/billing/UpgradeState";
import { isSelfHosted } from "@/lib/billing";

interface CustomEventsProps {
  siteId: string;
  dateRange: DateRange;
}

function EventDetails({ event }: { event: CustomEvent }) {
  const [expanded, setExpanded] = useState(false);
  const hasProperties = event.properties && Object.keys(event.properties).length > 0;

  return (
    <div className="border-t border-border py-2 first:border-t-0">
      <div
        className={`flex items-center justify-between ${hasProperties ? 'cursor-pointer' : ''}`}
        onClick={() => hasProperties && setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{event.event_name}</Badge>
            {event.url && (
              <span className="text-xs text-muted-foreground truncate">{event.url}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
            {event.country && <span>• {event.country}</span>}
            {event.browser && <span>• {event.browser}</span>}
          </div>
        </div>
        {hasProperties && (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {expanded && hasProperties && (
        <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
          <pre className="whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(event.properties, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function EventPropertyInsights({ siteId, eventName, dateRange }: { siteId: string, eventName: string, dateRange: DateRange }) {
  const { data: properties, isLoading } = useEventProperties({ siteId, eventName, dateRange });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
        No properties found for this event in the selected period.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      {Object.entries(properties).map(([key, stats]) => (
        <div key={key} className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="h-3 w-3 text-secondary" />
            <h4 className="font-semibold text-xs uppercase tracking-wider opacity-70">{key}</h4>
          </div>
          <div className="space-y-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="relative group">
                <div className="flex items-center justify-between text-xs mb-1 relative z-10">
                  <span className="font-medium truncate max-w-[70%]" title={stat.value}>
                    {stat.value === 'undefined' || stat.value === 'null' ? '(empty)' : stat.value}
                  </span>
                  <span className="opacity-70">{stat.percentage}% ({stat.count})</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary/80 rounded-full transition-all duration-500"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventGroupCard({ group, siteId, dateRange }: { group: EventGroup, siteId: string, dateRange: DateRange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-muted/30 rounded-lg border border-border">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${expanded ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'}`}>
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{group.name}</p>
            <p className="text-xs text-muted-foreground">
              Last: {formatDistanceToNow(new Date(group.lastOccurrence), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-xs font-semibold">{group.count}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Events</div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border pt-3 animation-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Property Insights</h3>
            <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded">
              Last 1000 events
            </span>
          </div>
          <EventPropertyInsights siteId={siteId} eventName={group.name} dateRange={dateRange} />
        </div>
      )}
    </div>
  );
}

export function CustomEvents({ siteId, dateRange }: CustomEventsProps) {
  const [showEvents, setShowEvents] = useState(false);
  const { data: groups, isLoading: groupsLoading } = useEventGroups({ siteId, dateRange });
  const { data: events, isLoading: eventsLoading } = useCustomEvents({ siteId, dateRange });

  const { subscription } = useSubscription();
  const isLocked = subscription?.plan === 'free' && !isSelfHosted();

  if (isLocked) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Custom Events</h3>
            </div>
          </div>
          <UpgradeState
            title="Unlock Custom Events"
            description="Upgrade to the Pro plan to track custom user actions and detailed event properties."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Custom Events</h3>
          </div>
          <Tabs value={showEvents ? "raw" : "insights"} onValueChange={(val) => setShowEvents(val === "raw")}>
            <TabsList className="h-8">
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              <TabsTrigger value="raw" className="text-xs">Raw Events</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {!showEvents ? (
          // Summary view - grouped events
          <div className="space-y-2">
            {groupsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : groups && groups.length > 0 ? (
              groups.map((group) => (
                <EventGroupCard
                  key={group.name}
                  group={group}
                  siteId={siteId}
                  dateRange={dateRange}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No custom events tracked yet
              </p>
            )}
          </div>
        ) : (
          // Detailed events view
          <ScrollArea className="h-80">
            <div className="space-y-0">
              {eventsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full mb-2" />
                ))
              ) : events && events.length > 0 ? (
                events.map((event) => (
                  <EventDetails key={event.id} event={event} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No custom events tracked yet
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

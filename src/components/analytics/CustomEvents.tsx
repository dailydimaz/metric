import { formatDistanceToNow } from "date-fns";
import { Zap, ChevronDown, ChevronUp, BarChart2, PieChart } from "lucide-react";
import { useState } from "react";
import { useEventGroups, useCustomEvents, CustomEvent, EventGroup, useEventProperties, PropertyStats } from "@/hooks/useCustomEvents";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="border-t border-base-300 py-2 first:border-t-0">
      <div
        className={`flex items-center justify-between ${hasProperties ? 'cursor-pointer' : ''}`}
        onClick={() => hasProperties && setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="badge badge-sm badge-secondary">{event.event_name}</span>
            {event.url && (
              <span className="text-xs text-base-content/60 truncate">{event.url}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-base-content/50">
            <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
            {event.country && <span>• {event.country}</span>}
            {event.browser && <span>• {event.browser}</span>}
          </div>
        </div>
        {hasProperties && (
          <button className="btn btn-ghost btn-xs">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {expanded && hasProperties && (
        <div className="mt-2 p-2 bg-base-300/50 rounded text-xs font-mono">
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
      <div className="p-4 text-center text-sm text-base-content/60 bg-base-200/30 rounded-lg">
        No properties found for this event in the selected period.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      {Object.entries(properties).map(([key, stats]) => (
        <div key={key} className="bg-base-200/50 rounded-lg p-3">
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
                <div className="h-1.5 w-full bg-base-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary/60 rounded-full transition-all duration-500"
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
    <div className="bg-base-200/30 rounded-lg border border-base-200">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-base-200/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${expanded ? 'bg-secondary/10 text-secondary' : 'bg-base-200 text-base-content/60'}`}>
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{group.name}</p>
            <p className="text-xs text-base-content/60">
              Last: {formatDistanceToNow(new Date(group.lastOccurrence), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-xs font-semibold">{group.count}</div>
            <div className="text-[10px] text-base-content/50 uppercase">Events</div>
          </div>
          <button className="btn btn-ghost btn-sm btn-square">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-base-200/50 pt-3 animation-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Property Insights</h3>
            <span className="text-xs text-base-content/50 ml-auto bg-base-200 px-2 py-0.5 rounded">
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
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold">Custom Events</h3>
            </div>
          </div>
          <UpgradeState
            title="Unlock Custom Events"
            description="Upgrade to the Pro plan to track custom user actions and detailed event properties."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-secondary" />
            <h3 className="font-semibold">Custom Events</h3>
          </div>
          <div className="tabs tabs-boxed tabs-sm">
            <button
              className={`tab ${!showEvents ? 'tab-active' : ''}`}
              onClick={() => setShowEvents(false)}
            >
              Insights
            </button>
            <button
              className={`tab ${showEvents ? 'tab-active' : ''}`}
              onClick={() => setShowEvents(true)}
            >
              Raw Events
            </button>
          </div>
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
              <p className="text-sm text-base-content/60 text-center py-8">
                No custom events tracked yet
              </p>
            )}
          </div>
        ) : (
          // Detailed events view
          <div className="space-y-0 max-h-80 overflow-y-auto">
            {eventsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))
            ) : events && events.length > 0 ? (
              events.map((event) => (
                <EventDetails key={event.id} event={event} />
              ))
            ) : (
              <p className="text-sm text-base-content/60 text-center py-8">
                No custom events tracked yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

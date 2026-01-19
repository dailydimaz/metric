import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Info, Target } from 'lucide-react';
import { useSites } from '@/hooks/useSites';
import { useGoals } from '@/hooks/useGoals';
import { useAttribution } from '@/hooks/useAttribution';
import { AttributionChart } from '@/components/analytics/AttributionChart';
import { AttributionStats } from '@/components/analytics/AttributionStats';
import { DateRange } from '@/hooks/useAnalytics';

export default function Attribution() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>();
  const [goalEvent, setGoalEvent] = useState('conversion');

  const { sites, isLoading: sitesLoading } = useSites();
  const { data: goals } = useGoals(selectedSiteId || '');
  const { data, isLoading, error } = useAttribution(selectedSiteId, dateRange, goalEvent);

  useEffect(() => {
    if (sites && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  if (sitesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <Info className="h-4 w-4" />
            <AlertTitle>No sites found</AlertTitle>
            <AlertDescription>
              Create a site first to view attribution data.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const availableEvents = [
    { value: 'conversion', label: 'Conversion (default)' },
    { value: 'signup', label: 'Signup' },
    { value: 'purchase', label: 'Purchase' },
    ...(goals?.map((g) => ({ value: g.event_name, label: g.name })) || []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8" />
              Attribution
            </h1>
            <p className="text-muted-foreground">
              See what drives conversions with multi-touch attribution
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {sites.length > 1 && (
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Goal Event Selector */}
        <div className="flex items-center gap-4">
          <Label htmlFor="goal-event">Conversion Event:</Label>
          <Select value={goalEvent} onValueChange={setGoalEvent}>
            <SelectTrigger id="goal-event" className="w-[200px]">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {availableEvents.map((event) => (
                <SelectItem key={event.value} value={event.value}>
                  {event.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-[400px]" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error loading attribution data</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Data Display */}
        {data && !isLoading && (
          <>
            <AttributionStats data={data} />
            <AttributionChart 
              firstTouch={data.firstTouch || []} 
              lastTouch={data.lastTouch || []} 
            />
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && 
          data.summary?.total_conversions === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No conversions found</AlertTitle>
            <AlertDescription>
              No "{goalEvent}" events were recorded in the selected date range. 
              Make sure you're tracking conversion events on your site.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsage } from '@/hooks/useUsage';
import { formatNumber, getUsagePercentage, isNearLimit } from '@/lib/billing';
import { AlertTriangle, Infinity, TrendingUp, Globe } from 'lucide-react';

export function UsageCard() {
  const { plan, isSelfHosted } = useSubscription();
  const { usage, isLoading } = useUsage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const eventsUsed = usage?.events_count || 0;
  const sitesUsed = usage?.sites_count || 0;
  const eventsLimit = plan.eventsLimit;
  const sitesLimit = plan.sitesLimit;

  const eventsPercentage = getUsagePercentage(eventsUsed, eventsLimit);
  const sitesPercentage = getUsagePercentage(sitesUsed, sitesLimit);
  const eventsNearLimit = isNearLimit(eventsUsed, eventsLimit);
  const sitesNearLimit = isNearLimit(sitesUsed, sitesLimit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Usage
              {isSelfHosted && (
                <Badge variant="secondary" className="ml-2">
                  <Infinity className="w-3 h-3 mr-1" />
                  Unlimited
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isSelfHosted 
                ? 'Self-hosted mode - all features unlocked'
                : `Your ${plan.name} plan usage this month`
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Events Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span>Events</span>
              {eventsNearLimit && (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
            </div>
            <span className="font-medium">
              {formatNumber(eventsUsed)} / {formatNumber(eventsLimit)}
            </span>
          </div>
          {eventsLimit > 0 && (
            <Progress 
              value={eventsPercentage} 
              className={eventsNearLimit ? 'bg-warning/20' : ''} 
            />
          )}
        </div>

        {/* Sites Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>Websites</span>
              {sitesNearLimit && (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
            </div>
            <span className="font-medium">
              {sitesUsed} / {sitesLimit < 0 ? 'Unlimited' : sitesLimit}
            </span>
          </div>
          {sitesLimit > 0 && (
            <Progress 
              value={sitesPercentage} 
              className={sitesNearLimit ? 'bg-warning/20' : ''} 
            />
          )}
        </div>

        {/* Data Retention */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data retention</span>
            <span className="font-medium">
              {plan.retentionDays < 0 ? 'Unlimited' : `${plan.retentionDays} days`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

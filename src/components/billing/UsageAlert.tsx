import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsage } from '@/hooks/useUsage';
import { isNearLimit, isOverLimit, formatNumber } from '@/lib/billing';
import { AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UsageAlert() {
  const { plan, isSelfHosted, billingEnabled } = useSubscription();
  const { usage } = useUsage();

  // Don't show alerts in self-hosted mode or if billing is disabled
  if (isSelfHosted || !billingEnabled) {
    return null;
  }

  const eventsUsed = usage?.events_count || 0;
  const eventsLimit = plan.eventsLimit;
  const sitesUsed = usage?.sites_count || 0;
  const sitesLimit = plan.sitesLimit;

  const eventsOver = isOverLimit(eventsUsed, eventsLimit);
  const eventsNear = isNearLimit(eventsUsed, eventsLimit);
  const sitesOver = isOverLimit(sitesUsed, sitesLimit);
  const sitesNear = isNearLimit(sitesUsed, sitesLimit);

  // Show critical alert if over limit
  if (eventsOver || sitesOver) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Usage Limit Exceeded</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {eventsOver && `You've exceeded your events limit (${formatNumber(eventsUsed)}/${formatNumber(eventsLimit)}). `}
            {sitesOver && `You've exceeded your sites limit (${sitesUsed}/${sitesLimit}). `}
            Upgrade to continue tracking.
          </span>
          <Button asChild size="sm" variant="outline" className="ml-4">
            <Link to="/#pricing">
              Upgrade <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if near limit
  if (eventsNear || sitesNear) {
    return (
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>Approaching Usage Limit</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {eventsNear && `You've used ${formatNumber(eventsUsed)} of ${formatNumber(eventsLimit)} events. `}
            {sitesNear && `You've used ${sitesUsed} of ${sitesLimit} sites. `}
            Consider upgrading soon.
          </span>
          <Button asChild size="sm" variant="outline" className="ml-4">
            <Link to="/#pricing">
              View Plans <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

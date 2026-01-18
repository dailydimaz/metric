import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsage } from '@/hooks/useUsage';
import { isNearLimit, isOverLimit, formatNumber } from '@/lib/billing';
import { AlertTriangle, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

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

  // Calculate percentages
  const eventsPercent = Math.min((eventsUsed / eventsLimit) * 100, 100);
  const sitesPercent = Math.min((sitesUsed / sitesLimit) * 100, 100);

  const eventsOver = isOverLimit(eventsUsed, eventsLimit);
  const eventsNear = isNearLimit(eventsUsed, eventsLimit);
  const sitesOver = isOverLimit(sitesUsed, sitesLimit);
  const sitesNear = isNearLimit(sitesUsed, sitesLimit);

  // Show critical alert if over limit
  if (eventsOver || sitesOver) {
    return (
      <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertTitle className="text-destructive font-semibold">Usage Limit Exceeded</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm text-foreground/80">
            {eventsOver && `You've exceeded your events limit. `}
            {sitesOver && `You've exceeded your sites limit. `}
            Upgrade your plan to continue tracking new data.
          </p>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-foreground/70">
              <span>Usage</span>
              <span>{formatNumber(eventsUsed)} / {formatNumber(eventsLimit)}</span>
            </div>
            <Progress value={eventsPercent} className="h-2 bg-destructive/20" indicatorClassName="bg-destructive" />
          </div>

          <div className="pt-2">
            <Button asChild size="sm" variant="destructive" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
              <Link to="/#pricing">
                Upgrade Plan <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if near limit
  if (eventsNear || sitesNear) {
    return (
      <Alert className="border-warning/30 bg-warning/5 text-warning-foreground">
        <TrendingUp className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning font-semibold flex items-center gap-2">
          Approaching Usage Limit
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm text-foreground/80">
            You are approaching your usage limits. Consider upgrading to avoid data loss.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-foreground/70">
                <span>Events</span>
                <span>{Math.round(eventsPercent)}%</span>
              </div>
              <Progress value={eventsPercent} className="h-1.5 bg-warning/20" indicatorClassName="bg-warning" />
            </div>
            {sitesNear && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-foreground/70">
                  <span>Sites</span>
                  <span>{sitesUsed} / {sitesLimit}</span>
                </div>
                <Progress value={sitesPercent} className="h-1.5 bg-warning/20" indicatorClassName="bg-warning" />
              </div>
            )}
          </div>

          <div className="pt-1">
            <Button asChild size="sm" variant="outline" className="text-warning border-warning/30 hover:bg-warning/10 hover:text-warning shadow-sm">
              <Link to="/#pricing">
                View Plans <ArrowUpRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, Crown, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PlanCard() {
  const { plan, subscription, isSelfHosted, billingEnabled } = useSubscription();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isSelfHosted ? (
                <>
                  <Server className="w-5 h-5 text-primary" />
                  Self-Hosted
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 text-primary" />
                  {plan.name} Plan
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isSelfHosted 
                ? 'Running on your own infrastructure with full access'
                : `You're on the ${plan.name} plan`
              }
            </CardDescription>
          </div>
          <Badge variant={isSelfHosted ? 'secondary' : subscription?.plan === 'pro' ? 'default' : 'outline'}>
            {isSelfHosted ? 'Self-Hosted' : plan.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {!isSelfHosted && billingEnabled && (
          <div className="flex gap-3">
            {subscription?.plan !== 'business' && (
              <Button asChild className="flex-1">
                <Link to="/#pricing">Upgrade Plan</Link>
              </Button>
            )}
            {subscription?.plan !== 'free' && !subscription?.cancel_at_period_end && (
              <Button variant="outline" className="flex-1">
                Cancel Plan
              </Button>
            )}
          </div>
        )}

        {subscription?.cancel_at_period_end && (
          <p className="text-sm text-muted-foreground mt-4">
            Your plan will be canceled at the end of the current billing period.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

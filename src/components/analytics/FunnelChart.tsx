import { FunnelStepAnalytics } from "@/hooks/useFunnels";

interface FunnelChartProps {
  steps: FunnelStepAnalytics[];
  isLoading?: boolean;
}

export function FunnelChart({ steps, isLoading }: FunnelChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No funnel data available
      </div>
    );
  }

  const maxVisitors = steps[0]?.visitors || 1;

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const widthPercent = maxVisitors > 0 ? (step.visitors / maxVisitors) * 100 : 0;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.step_index} className="relative">
            {/* Step bar */}
            <div className="relative">
              <div
                className="h-16 rounded-lg transition-all duration-500 flex items-center justify-between px-4"
                style={{
                  width: `${Math.max(widthPercent, 20)}%`,
                  background: `linear-gradient(90deg, hsl(var(--primary) / ${0.9 - index * 0.15}) 0%, hsl(var(--primary) / ${0.7 - index * 0.15}) 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary-foreground font-bold text-lg">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-primary-foreground font-medium text-sm truncate max-w-[200px]">
                      {step.step_name}
                    </p>
                    <p className="text-primary-foreground/80 text-xs">
                      {step.visitors.toLocaleString()} visitors
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-primary-foreground font-bold text-lg">
                    {step.conversion_rate}%
                  </p>
                  {index > 0 && step.drop_off_rate > 0 && (
                    <p className="text-primary-foreground/70 text-xs">
                      -{step.drop_off_rate}% drop-off
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div className="flex items-center gap-2 py-1 pl-4">
                <div className="w-0.5 h-4 bg-border" />
                {steps[index + 1] && (
                  <span className="text-xs text-muted-foreground">
                    {steps[index + 1].visitors < step.visitors
                      ? `${step.visitors - steps[index + 1].visitors} dropped`
                      : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall Conversion</p>
            <p className="text-2xl font-bold text-foreground">
              {steps[steps.length - 1]?.conversion_rate || 0}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {steps[0]?.visitors || 0} → {steps[steps.length - 1]?.visitors || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {steps[0]?.visitors && steps[steps.length - 1]?.visitors
                ? `${steps[0].visitors - steps[steps.length - 1].visitors} total drop-offs`
                : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

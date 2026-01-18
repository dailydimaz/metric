import { useState } from "react";
import { Target, Radio, Megaphone } from "lucide-react";
import { UTMStats as UTMStatsType } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

interface UTMStatsProps {
  utmStats: UTMStatsType | undefined;
  isLoading: boolean;
}

type UTMTab = "sources" | "mediums" | "campaigns";

const tabConfig: Record<UTMTab, { label: string; icon: typeof Target; emptyText: string }> = {
  sources: { label: "Sources", icon: Radio, emptyText: "No source data yet" },
  mediums: { label: "Mediums", icon: Target, emptyText: "No medium data yet" },
  campaigns: { label: "Campaigns", icon: Megaphone, emptyText: "No campaign data yet" },
};

export function UTMStats({ utmStats, isLoading }: UTMStatsProps) {
  const [activeTab, setActiveTab] = useState<UTMTab>("sources");

  const currentData = utmStats?.[activeTab] || [];
  const { icon: Icon, emptyText } = tabConfig[activeTab];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-muted rounded-lg">
            <Target className="h-4 w-4 text-foreground/70" />
          </div>
          <CardTitle className="text-base font-semibold">UTM Campaigns</CardTitle>
        </div>
        <ToggleGroup type="single" value={activeTab} onValueChange={(val) => val && setActiveTab(val as UTMTab)} className="bg-muted p-1 rounded-lg">
          {Object.entries(tabConfig).map(([key, config]) => (
            <ToggleGroupItem
              key={key}
              value={key}
              size="sm"
              className="h-7 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {config.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : currentData.length > 0 ? (
          <div className="space-y-3">
            {currentData.map((item, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                <div
                  className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ width: `${item.percentage}%` }}
                />
                <div className="relative flex items-center justify-between py-2.5 px-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">{item.visits}</span>
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
            <Icon className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">{emptyText}</p>
            <p className="text-xs mt-1 opacity-70">Add ?utm_{activeTab.slice(0, -1)}=... to your URLs</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

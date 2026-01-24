import { Monitor, Smartphone, Tablet, Globe, Chrome, LayoutGrid, Layers } from "lucide-react";
import { DeviceStat } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type BreakdownType = "browser" | "os" | "device";

interface DeviceStatsProps {
  browsers: DeviceStat[] | undefined;
  operatingSystems: DeviceStat[] | undefined;
  devices: DeviceStat[] | undefined;
  isLoading: boolean;
  onBreakdown?: (type: BreakdownType, value: string) => void;
}

function StatList({
  title,
  items,
  icon,
  isLoading,
  type,
  onBreakdown,
}: {
  title: string;
  items: DeviceStat[] | undefined;
  icon: React.ReactNode;
  isLoading: boolean;
  type: BreakdownType;
  onBreakdown?: (type: BreakdownType, value: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-muted rounded-md text-foreground/70">
          {icon}
        </div>
        <h4 className="text-sm font-semibold">{title}</h4>
        {onBreakdown && (
          <Layers className="h-3 w-3 text-muted-foreground ml-auto" />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      ) : Array.isArray(items) && items.length > 0 ? (
        <div className="space-y-4">
          {items.slice(0, 5).map((item, index) => {
            if (!item) return null;
            return (
              <div
                key={index}
                className={`group space-y-1.5 ${onBreakdown ? 'cursor-pointer' : ''}`}
                onClick={() => onBreakdown?.(type, item.name)}
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-foreground/80 group-hover:text-primary transition-colors">{item.name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground font-mono">{(item.percentage || 0).toFixed(1)}%</span>
                </div>
                <Progress value={item.percentage || 0} className="h-1.5" />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic py-4">No data available</p>
      )}
    </div>
  );
}

export function DeviceStats({ browsers, operatingSystems, devices, isLoading, onBreakdown }: DeviceStatsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Tech Specs</CardTitle>
        </div>
        {onBreakdown && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span className="hidden sm:inline">Click to drill down</span>
          </span>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid gap-8 md:grid-cols-3">
          <StatList
            title="Device Type"
            items={devices}
            icon={<Monitor className="h-4 w-4" />}
            isLoading={isLoading}
            type="device"
            onBreakdown={onBreakdown}
          />
          <StatList
            title="Browser"
            items={browsers}
            icon={<Chrome className="h-4 w-4" />}
            isLoading={isLoading}
            type="browser"
            onBreakdown={onBreakdown}
          />
          <StatList
            title="Operating System"
            items={operatingSystems}
            icon={<Globe className="h-4 w-4" />}
            isLoading={isLoading}
            type="os"
            onBreakdown={onBreakdown}
          />
        </div>
      </CardContent>
    </Card>
  );
}

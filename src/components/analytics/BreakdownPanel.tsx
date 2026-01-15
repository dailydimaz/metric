import { useState } from "react";
import { X, ChevronRight, TrendingUp, Users, Eye, ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsFilter, DateRange } from "@/hooks/useAnalytics";
import { useBreakdownStats } from "@/hooks/useBreakdownStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export type BreakdownDimension = "country" | "browser" | "os" | "device" | "url" | "referrer";

interface BreakdownPanelProps {
  siteId: string;
  dateRange: DateRange;
  dimension: BreakdownDimension;
  value: string;
  baseFilters?: AnalyticsFilter;
  onClose: () => void;
  onDrillDown: (dimension: BreakdownDimension, value: string) => void;
}

const DIMENSION_LABELS: Record<BreakdownDimension, string> = {
  country: "Country",
  browser: "Browser",
  os: "Operating System",
  device: "Device Type",
  url: "Page",
  referrer: "Referrer",
};

const SECONDARY_DIMENSIONS: Record<BreakdownDimension, BreakdownDimension[]> = {
  country: ["browser", "device", "url", "referrer"],
  browser: ["country", "device", "os", "url"],
  os: ["country", "browser", "device", "url"],
  device: ["country", "browser", "url", "referrer"],
  url: ["country", "browser", "device", "referrer"],
  referrer: ["country", "browser", "device", "url"],
};

export function BreakdownPanel({
  siteId,
  dateRange,
  dimension,
  value,
  baseFilters = {},
  onClose,
  onDrillDown,
}: BreakdownPanelProps) {
  const [activeTab, setActiveTab] = useState<BreakdownDimension>(
    SECONDARY_DIMENSIONS[dimension][0]
  );

  // Create filters including the current breakdown
  const breakdownFilters: AnalyticsFilter = {
    ...baseFilters,
    [dimension === "referrer" ? "referrerPattern" : dimension]: value,
  };

  const { data, isLoading } = useBreakdownStats({
    siteId,
    dateRange,
    filters: breakdownFilters,
    breakdownBy: activeTab,
  });

  const secondaryDimensions = SECONDARY_DIMENSIONS[dimension];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-base-100 h-full overflow-y-auto shadow-xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {DIMENSION_LABELS[dimension]} Breakdown
                </p>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  {value}
                </h2>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" />
              {data?.totalPageviews?.toLocaleString() || "..."} views
            </Badge>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-4 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : data?.uniqueVisitors?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground">Visitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 mx-auto mb-1 text-info" />
              <p className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : data?.totalPageviews?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground">Pageviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : `${data?.bounceRate?.toFixed(1) || 0}%`}
              </p>
              <p className="text-xs text-muted-foreground">Bounce Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Breakdown Tabs */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BreakdownDimension)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {secondaryDimensions.map((dim) => (
                <TabsTrigger key={dim} value={dim} className="text-xs">
                  {DIMENSION_LABELS[dim]}
                </TabsTrigger>
              ))}
            </TabsList>

            {secondaryDimensions.map((dim) => (
              <TabsContent key={dim} value={dim} className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      By {DIMENSION_LABELS[dim]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : data?.breakdown && data.breakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <thead>
                            <tr className="text-xs text-muted-foreground">
                              <th>{DIMENSION_LABELS[dim]}</th>
                              <th className="text-right">Visitors</th>
                              <th className="text-right">Views</th>
                              <th className="text-right">%</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.breakdown.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-base-50 cursor-pointer group"
                                onClick={() => onDrillDown(dim, item.value)}
                              >
                                <td className="font-medium max-w-[180px] truncate">
                                  {item.value || "(not set)"}
                                </td>
                                <td className="text-right text-muted-foreground">
                                  {item.visitors.toLocaleString()}
                                </td>
                                <td className="text-right font-medium">
                                  {item.pageviews.toLocaleString()}
                                </td>
                                <td className="text-right text-xs text-muted-foreground">
                                  {item.percentage.toFixed(1)}%
                                </td>
                                <td className="w-8">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No data available for this breakdown
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Active Filters */}
        {Object.keys(breakdownFilters).length > 0 && (
          <div className="p-4 mt-4 border-t border-base-200">
            <p className="text-xs text-muted-foreground mb-2">Active Filters</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(breakdownFilters).map(([key, val]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {val}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

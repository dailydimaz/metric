import { useState } from "react";
import { X, ChevronRight, TrendingUp, Users, Eye, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsFilter, DateRange } from "@/hooks/useAnalytics";
import { useBreakdownStats } from "@/hooks/useBreakdownStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-background h-full overflow-y-auto shadow-2xl border-l border-border animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
                <X className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {DIMENSION_LABELS[dimension]} Breakdown
                </p>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  {value}
                </h2>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1.5 h-7">
              <Eye className="h-3 w-3" />
              <span className="font-mono">{data?.totalPageviews?.toLocaleString() || "..."}</span> views
            </Badge>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-4 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-primary/10 rounded-full w-fit mx-auto mb-2">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : data?.uniqueVisitors?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase mt-1">Visitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-blue-500/10 rounded-full w-fit mx-auto mb-2">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : data?.totalPageviews?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase mt-1">Pageviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="p-2 bg-emerald-500/10 rounded-full w-fit mx-auto mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : `${data?.bounceRate?.toFixed(1) || 0}%`}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase mt-1">Bounce Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Breakdown Tabs */}
        <div className="px-4 pb-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BreakdownDimension)}>
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 gap-1">
              {secondaryDimensions.map((dim) => (
                <TabsTrigger key={dim} value={dim} className="text-xs py-1.5 px-3">
                  {DIMENSION_LABELS[dim]}
                </TabsTrigger>
              ))}
            </TabsList>

            {secondaryDimensions.map((dim) => (
              <TabsContent key={dim} value={dim} className="mt-4">
                <Card>
                  <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      By {DIMENSION_LABELS[dim]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-4 space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : data?.breakdown && data.breakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableHead className="pl-4">{DIMENSION_LABELS[dim]}</TableHead>
                              <TableHead className="text-right">Visitors</TableHead>
                              <TableHead className="text-right">Views</TableHead>
                              <TableHead className="text-right">%</TableHead>
                              <TableHead className="w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.breakdown.map((item, idx) => (
                              <TableRow
                                key={idx}
                                className="group cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => onDrillDown(dim, item.value)}
                              >
                                <TableCell className="font-medium max-w-[180px] truncate pl-4">
                                  {item.value || "(not set)"}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {item.visitors.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.pageviews.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground font-mono">
                                  {item.percentage.toFixed(1)}%
                                </TableCell>
                                <TableCell>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground/50">
                        <Layers className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No data available for this breakdown</p>
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
          <div className="p-4 mt-auto border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Active Filters</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(breakdownFilters).map(([key, val]) => (
                <Badge key={key} variant="outline" className="text-xs bg-background text-foreground/80">
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

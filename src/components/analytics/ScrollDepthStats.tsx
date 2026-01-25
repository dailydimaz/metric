import { ArrowDownToLine, MoveDown } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useScrollDepth } from "@/hooks/useScrollDepth";

interface ScrollDepthStatsProps {
    siteId: string;
    dateRange: DateRange;
}

export function ScrollDepthStats({ siteId, dateRange }: ScrollDepthStatsProps) {
    const { data: pages, isLoading } = useScrollDepth({ siteId, dateRange });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <ArrowDownToLine className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold">Scroll Depth</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : pages && pages.length > 0 ? (
                    <div className="flex flex-col">
                        {pages.map((page, idx) => (
                            <div
                                key={page.url}
                                className="p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium truncate max-w-[250px]" title={page.url}>
                                        {page.url}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        <MoveDown className="h-3 w-3" />
                                        <span>Avg {Math.round(page.averageDepth)}%</span>
                                    </div>
                                </div>

                                {/* Distribution Bar */}
                                <div className="flex h-8 w-full rounded-md overflow-hidden bg-muted/50 border border-border/50">
                                    {page.distribution.map((d) => {
                                        // Normalize the width visually ? 
                                        // Actually a better viz is a bar chart per milestone.
                                        // Or just segments. 
                                        // Let's do a simple bar chart of counts or percentages?
                                        // "Bar chart visualization of scroll distribution"
                                        return (
                                            <div
                                                key={d.depth}
                                                className="h-full flex items-center justify-center text-[10px] font-medium text-white/90 transition-all hover:brightness-110"
                                                style={{
                                                    width: `${d.percentage}%`,
                                                    backgroundColor: `hsl(var(--primary) / ${0.2 + (d.depth / 100)})`
                                                }}
                                                title={`${d.count} reached ${d.depth}%`}
                                            >
                                                {d.depth}%
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-1">
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>90%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground/60">
                        <ArrowDownToLine className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p>No scroll depth data yet</p>
                        <p className="text-xs mt-1 text-muted-foreground/40">
                            User scrolling behavior will appear here
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

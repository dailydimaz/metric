import { Timer, Clock } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useEngagement } from "@/hooks/useEngagement";

interface EngagementStatsProps {
    siteId: string;
    dateRange: DateRange;
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
}

export function EngagementStats({ siteId, dateRange }: EngagementStatsProps) {
    const { data: pages, isLoading } = useEngagement({ siteId, dateRange });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Timer className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold">Time on Page</CardTitle>
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
                                className="group flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium truncate max-w-[200px]" title={page.url}>
                                        {page.url}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-semibold tabular-nums">
                                            {formatDuration(page.avgDuration)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            Avg Time
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground/60">
                        <Clock className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p>No engagement data yet</p>
                        <p className="text-xs mt-1 text-muted-foreground/40">
                            Time on page metrics will appear here
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

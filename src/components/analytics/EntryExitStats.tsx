import { LogIn, LogOut, ArrowRight } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntryExitPages } from "@/hooks/useEntryExitPages";

interface EntryExitStatsProps {
    siteId: string;
    dateRange: DateRange;
}

export function EntryExitStats({ siteId, dateRange }: EntryExitStatsProps) {
    const { data: pages, isLoading } = useEntryExitPages({ siteId, dateRange });

    const sortedByEntry = [...(pages || [])].sort((a, b) => b.entryCount - a.entryCount);
    const sortedByExit = [...(pages || [])].sort((a, b) => b.exitCount - a.exitCount);

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <ArrowRight className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold">Entry & Exit Pages</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Tabs defaultValue="entry" className="w-full">
                    <div className="border-b border-border/50 px-4">
                        <TabsList className="h-10 bg-transparent p-0">
                            <TabsTrigger
                                value="entry"
                                className="h-full rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                Top Entry Pages
                            </TabsTrigger>
                            <TabsTrigger
                                value="exit"
                                className="h-full rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                Top Exit Pages
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="entry" className="m-0">
                        {isLoading ? (
                            <div className="p-4 space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedByEntry.length > 0 ? (
                            <div className="flex flex-col">
                                {sortedByEntry.map((page, idx) => (
                                    <div
                                        key={`entry-${page.url}`}
                                        className="flex items-center gap-3 p-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium">
                                            <LogIn className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate" title={page.url}>
                                                    {page.url}
                                                </span>
                                                <span className="text-sm font-semibold tabular-nums">
                                                    {page.entryCount}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted/50 rounded-full h-1.5 mt-2 overflow-hidden">
                                                <div
                                                    className="bg-green-500 h-full rounded-full"
                                                    style={{ width: `${(page.entryCount / (sortedByEntry[0]?.entryCount || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-sm text-muted-foreground/60">
                                <LogIn className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                <p>No entry page data available</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="exit" className="m-0">
                        {isLoading ? (
                            <div className="p-4 space-y-4">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : sortedByExit.length > 0 ? (
                            <div className="flex flex-col">
                                {sortedByExit.map((page, idx) => (
                                    <div
                                        key={`exit-${page.url}`}
                                        className="flex items-center gap-3 p-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium">
                                            <LogOut className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate" title={page.url}>
                                                    {page.url}
                                                </span>
                                                <span className="text-sm font-semibold tabular-nums">
                                                    {page.exitCount}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted/50 rounded-full h-1.5 mt-2 overflow-hidden">
                                                <div
                                                    className="bg-red-500 h-full rounded-full"
                                                    style={{ width: `${(page.exitCount / (sortedByExit[0]?.exitCount || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-sm text-muted-foreground/60">
                                <LogOut className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                <p>No exit page data available</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

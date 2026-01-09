import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserJourneys, DateRange } from "@/hooks/useAnalytics";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { Route, Info } from "lucide-react";

export default function Journey() {
    const { siteId } = useParams();
    const [dateRange, setDateRange] = useState<DateRange>("30d");

    const { data: journeys, isLoading } = useUserJourneys({
        siteId: siteId || "",
        dateRange
    });

    const chartData = useMemo(() => {
        if (!journeys || journeys.length === 0) return { nodes: [], links: [] };

        const nodesSet = new Set<string>();
        journeys.forEach(j => {
            nodesSet.add(j.source);
            nodesSet.add(j.target);
        });

        const nodes = Array.from(nodesSet).map(name => ({ name }));
        const nodeMap = new Map(nodes.map((node, index) => [node.name, index]));

        const links = journeys.map(j => ({
            source: nodeMap.get(j.source)!,
            target: nodeMap.get(j.target)!,
            value: j.count
        }));

        return { nodes, links };
    }, [journeys]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Journeys</h1>
                        <p className="text-muted-foreground mt-2">
                            Visualize how users navigate through your site.
                        </p>
                    </div>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-medium">Path Analysis</CardTitle>
                                    <CardDescription>
                                        Common navigation paths (Top 50)
                                    </CardDescription>
                                </div>
                                <Route className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-[500px] flex items-center justify-center">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            ) : chartData.nodes.length > 0 ? (
                                <div className="h-[500px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Sankey
                                            data={chartData}
                                            node={{ strokeWidth: 0 }}
                                            nodePadding={50}
                                            margin={{
                                                left: 20,
                                                right: 20,
                                                top: 20,
                                                bottom: 20,
                                            }}
                                            link={{ stroke: 'var(--primary)', strokeOpacity: 0.2 }}
                                        >
                                            <Tooltip />
                                        </Sankey>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                                    <Info className="h-8 w-8 mb-4 opacity-50" />
                                    <p>No journey data available for this period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

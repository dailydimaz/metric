import { useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBreakdownStats, DateRange } from "@/hooks/useAnalytics";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Filter, ArrowDownWideNarrow } from "lucide-react";

export default function Breakdown() {
    const { siteId } = useParams();
    const [dateRange, setDateRange] = useState<DateRange>("30d");
    const [groupBy, setGroupBy] = useState<string>("browser");

    const { data: stats, isLoading } = useBreakdownStats({
        siteId: siteId || "",
        dateRange,
        groupBy
    });

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Breakdown</h1>
                        <p className="text-muted-foreground mt-2">
                            Deep dive into your analytics data.
                        </p>
                    </div>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-base font-medium">Detailed Analysis</CardTitle>
                                        <CardDescription>
                                            Group and analyze your traffic
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Group by:</span>
                                    <Select value={groupBy} onValueChange={setGroupBy}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="browser">Browser</SelectItem>
                                            <SelectItem value="os">OS</SelectItem>
                                            <SelectItem value="device_type">Device</SelectItem>
                                            <SelectItem value="country">Country</SelectItem>
                                            <SelectItem value="city">City</SelectItem>
                                            <SelectItem value="language">Language</SelectItem>
                                            <SelectItem value="referrer">Referrer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-[400px] flex items-center justify-center">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            ) : stats && stats.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[200px]">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1).replace('_', ' ')}</TableHead>
                                                <TableHead className="text-right">Visitors</TableHead>
                                                <TableHead className="text-right">Pageviews</TableHead>
                                                <TableHead className="text-right">Bounce Rate</TableHead>
                                                <TableHead className="text-right">Avg. Duration</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">
                                                        {row.value || '(Active)'}
                                                    </TableCell>
                                                    <TableCell className="text-right">{row.visitors.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{row.pageviews.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{row.bounce_rate}%</TableCell>
                                                    <TableCell className="text-right">{formatDuration(row.avg_duration)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <Filter className="h-8 w-8 mb-4 opacity-50" />
                                    <p>No data available for this breakdown</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

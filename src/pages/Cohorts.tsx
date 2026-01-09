import { useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRetentionCohorts } from "@/hooks/useAnalytics";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { DateRange } from "@/hooks/useAnalytics";
import { Users, Info } from "lucide-react";

export default function Cohorts() {
    const { siteId } = useParams();
    const [dateRange, setDateRange] = useState<DateRange>("30d");

    const { data: cohorts, isLoading } = useRetentionCohorts({
        siteId: siteId || "",
        dateRange
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Retention Cohorts</h1>
                        <p className="text-muted-foreground mt-2">
                            Visualize user retention over time.
                        </p>
                    </div>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-medium">Cohort Analysis</CardTitle>
                                    <CardDescription>
                                        Percentage of users returning after their first visit
                                    </CardDescription>
                                </div>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-[400px] flex items-center justify-center">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            ) : cohorts && cohorts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr>
                                                <th className="p-2 text-left font-medium text-muted-foreground w-32">Date</th>
                                                <th className="p-2 text-left font-medium text-muted-foreground w-20">Users</th>
                                                <th className="p-2 text-center font-medium text-muted-foreground">Day 0</th>
                                                {[...Array(7)].map((_, i) => (
                                                    <th key={i} className="p-2 text-center font-medium text-muted-foreground">
                                                        Day {i + 1}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cohorts.map((cohort: any) => (
                                                <tr key={cohort.date} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                    <td className="p-2 font-medium">
                                                        {new Date(cohort.date).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">{cohort.visitors}</td>
                                                    <td className="p-2 text-center bg-primary/20 font-medium">100%</td>
                                                    {cohort.retention.map((day: any) => {
                                                        const percentage = Math.round((day.retained / cohort.visitors) * 100);
                                                        const opacity = Math.max(0.1, percentage / 100);
                                                        return (
                                                            <td key={day.day} className="p-1">
                                                                <div
                                                                    className="w-full h-8 flex items-center justify-center rounded text-xs font-medium transition-all"
                                                                    style={{
                                                                        backgroundColor: `hsl(var(--primary) / ${opacity})`,
                                                                        color: percentage > 50 ? 'white' : 'inherit'
                                                                    }}
                                                                    title={`${day.retained} users`}
                                                                >
                                                                    {percentage > 0 ? `${percentage}%` : ''}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <Info className="h-8 w-8 mb-4 opacity-50" />
                                    <p>No cohort data available for this period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

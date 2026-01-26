import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, TrendingUp, LayoutGrid } from "lucide-react";
import { format, subDays } from "date-fns";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GroupStats {
    visitors: number;
    pageviews: number;
    timeseries: Array<{ date: string; visitors: number; pageviews: number }>;
    top_sites: Array<{ name: string; visitors: number; pageviews: number }>;
}

export default function SiteGroupDashboard() {
    const { groupId } = useParams<{ groupId: string }>();
    const [range, setRange] = useState("7d");

    const getDateRange = () => {
        const end = new Date();
        let start: Date;
        switch (range) {
            case "30d": start = subDays(end, 30); break;
            case "90d": start = subDays(end, 90); break;
            case "today": start = new Date(); start.setHours(0, 0, 0, 0); break;
            default: start = subDays(end, 7);
        }
        return {
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd"),
        };
    };

    const { data: group, isLoading: groupLoading } = useQuery({
        queryKey: ["site-group", groupId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_groups")
                .select("*")
                .eq("id", groupId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!groupId,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["site-group-stats", groupId, range],
        queryFn: async () => {
            const dates = getDateRange();
            const { data, error } = await supabase.rpc("get_site_group_stats", {
                _group_id: groupId,
                _start_date: dates.start,
                _end_date: dates.end,
            });
            if (error) throw error;
            return data as unknown as GroupStats;
        },
        enabled: !!groupId,
    });

    if (groupLoading || statsLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!group) return <div>Group not found</div>;

    const chartData = stats?.timeseries?.map(p => ({
        date: format(new Date(p.date), 'MMM d'),
        Visitors: p.visitors,
        Pageviews: p.pageviews
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                    <p className="text-muted-foreground">Aggregated statistics for {group.description || "your site group"}</p>
                </div>
                <Select value={range} onValueChange={setRange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.visitors.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pageviews</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.pageviews.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {chartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                                    <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Visitors" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="Pageviews" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {stats?.top_sites && stats.top_sites.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5" />
                            Top Sites by Traffic
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.top_sites} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                    <XAxis type="number" className="text-muted-foreground" />
                                    <YAxis dataKey="name" type="category" width={100} className="text-muted-foreground" tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                    <Legend />
                                    <Bar dataKey="visitors" name="Visitors" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

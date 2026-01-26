import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Bell, Check, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlertsManagerProps {
    siteId: string;
}

interface Alert {
    id: string;
    name: string;
    type: "traffic_spike" | "traffic_drop" | "uptime";
    metric: "visitors" | "pageviews" | "bounce_rate";
    threshold: number;
    comparison: "gt" | "lt";
    channel: "email" | "slack" | "webhook";
    is_enabled: boolean;
}

export function AlertsManager({ siteId }: AlertsManagerProps) {
    const { toast } = useToast();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [newAlert, setNewAlert] = useState<Partial<Alert>>({
        name: "",
        type: "traffic_spike",
        metric: "visitors",
        threshold: 100,
        comparison: "gt",
        channel: "email",
        is_enabled: true
    });

    useEffect(() => {
        fetchAlerts();
    }, [siteId]);

    const fetchAlerts = async () => {
        try {
            const { data, error } = await supabase
                .from("alerts")
                .select("*")
                .eq("site_id", siteId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAlerts(data as Alert[]);
        } catch (error) {
            console.error("Error fetching alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newAlert.name || !newAlert.threshold) {
            toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
            return;
        }

        setIsCreating(true);
        try {
            const { error } = await supabase
                .from("alerts")
                .insert([{
                    site_id: siteId,
                    name: newAlert.name || 'Untitled Alert',
                    type: newAlert.type || 'traffic_spike',
                    metric: newAlert.metric || 'visitors',
                    threshold: newAlert.threshold || 100,
                    comparison: newAlert.comparison || 'gt',
                    channel: newAlert.channel || 'email',
                    is_enabled: newAlert.is_enabled ?? true
                }]);

            if (error) throw error;

            toast({ title: "Success", description: "Alert created successfully" });
            setIsCreateOpen(false);
            fetchAlerts();
            setNewAlert({
                name: "",
                type: "traffic_spike",
                metric: "visitors",
                threshold: 100,
                comparison: "gt",
                channel: "email",
                is_enabled: true
            });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from("alerts").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Success", description: "Alert deleted" });
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const toggleEnabled = async (alert: Alert) => {
        try {
            const { error } = await supabase
                .from("alerts")
                .update({ is_enabled: !alert.is_enabled })
                .eq("id", alert.id);

            if (error) throw error;

            setAlerts(alerts.map(a => a.id === alert.id ? { ...a, is_enabled: !a.is_enabled } : a));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Custom Alerts</CardTitle>
                    <CardDescription>Get notified when anomalies are detected.</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Alert</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Alert</DialogTitle>
                            <DialogDescription>Configure your alert conditions.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Alert Name</Label>
                                <Input value={newAlert.name} onChange={e => setNewAlert({ ...newAlert, name: e.target.value })} placeholder="e.g. Traffic Spike" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select value={newAlert.type} onValueChange={(v: any) => setNewAlert({ ...newAlert, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="traffic_spike">Traffic Spike</SelectItem>
                                            <SelectItem value="traffic_drop">Traffic Drop</SelectItem>
                                            <SelectItem value="uptime">Uptime Issue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Metric</Label>
                                    <Select value={newAlert.metric} onValueChange={(v: any) => setNewAlert({ ...newAlert, metric: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="visitors">Visitors</SelectItem>
                                            <SelectItem value="pageviews">Page Views</SelectItem>
                                            <SelectItem value="bounce_rate">Bounce Rate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Condition</Label>
                                    <Select value={newAlert.comparison} onValueChange={(v: any) => setNewAlert({ ...newAlert, comparison: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gt">Greater Than</SelectItem>
                                            <SelectItem value="lt">Less Than</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Threshold</Label>
                                    <Input type="number" value={newAlert.threshold} onChange={e => setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Channel</Label>
                                <Select value={newAlert.channel} onValueChange={(v: any) => setNewAlert({ ...newAlert, channel: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="slack">Slack</SelectItem>
                                        <SelectItem value="webhook">Webhook</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Alert
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No alerts configured yet.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alerts.map(alert => (
                                <TableRow key={alert.id}>
                                    <TableCell className="font-medium">{alert.name}</TableCell>
                                    <TableCell>
                                        {alert.metric} {alert.comparison === 'gt' ? '>' : '<'} {alert.threshold}
                                    </TableCell>
                                    <TableCell className="capitalize">{alert.channel}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => toggleEnabled(alert)} className={alert.is_enabled ? "text-green-500" : "text-muted-foreground"}>
                                            {alert.is_enabled ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                                            {alert.is_enabled ? "Active" : "Disabled"}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(alert.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

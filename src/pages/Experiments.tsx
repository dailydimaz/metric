import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Experiment {
    id: string;
    name: string;
    status: "draft" | "active" | "completed";
    variants: any[];
}

export default function Experiments() {
    const { siteId } = useParams<{ siteId: string }>();
    const { toast } = useToast();
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newExpName, setNewExpName] = useState("");

    useEffect(() => {
        if (siteId) fetchExperiments();
    }, [siteId]);

    const fetchExperiments = async () => {
        try {
            const { data, error } = await supabase
                .from("experiments")
                .select("*, variants:experiment_variants(*)")
                .eq("site_id", siteId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setExperiments(data as Experiment[]);
        } catch (error) {
            console.error("Error fetching experiments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newExpName) return;
        try {
            // 1. Create Experiment
            const { data: exp, error: expError } = await supabase
                .from("experiments")
                .insert([{ site_id: siteId, name: newExpName, status: "draft", target_url: '/', goal_event: 'conversion' }])
                .select()
                .single();

            if (expError) throw expError;

            // 2. Create Default Variants (Control & Variant A)
            const { error: varError } = await supabase
                .from("experiment_variants")
                .insert([
                    { experiment_id: exp.id, name: "Control", weight: 50 },
                    { experiment_id: exp.id, name: "Variant A", weight: 50 }
                ]);

            if (varError) throw varError;

            toast({ title: "Experiment created", description: "Configure your variants next." });
            setIsCreateOpen(false);
            setNewExpName("");
            fetchExperiments();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
                    <p className="text-muted-foreground">Run experiments to optimize your site.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> New Experiment</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Experiment</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input value={newExpName} onChange={e => setNewExpName(e.target.value)} placeholder="e.g. Hero Headline Test" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <Loader2 className="animate-spin" /> : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Experiment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Variants</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {experiments.map(exp => (
                                    <TableRow key={exp.id}>
                                        <TableCell className="font-medium">{exp.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={exp.status === 'active' ? 'default' : 'secondary'}>
                                                {exp.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{exp.variants?.length || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Manage</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {experiments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No experiments found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreateSiteGroupDialog } from "@/components/dashboard/CreateSiteGroupDialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Loader2, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function SiteGroups() {
    const navigate = useNavigate();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const { data: groups, isLoading } = useQuery({
        queryKey: ["site-groups"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_groups")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                <motion.div variants={item} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                            Site Groups
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your site groups and view aggregated analytics
                        </p>
                    </div>
                    <Button 
                        onClick={() => setCreateDialogOpen(true)}
                        className="shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 gap-2" 
                        size="lg"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Group
                    </Button>
                </motion.div>

                <motion.div variants={item}>
                    {groups && groups.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {groups.map((group) => (
                                <Link key={group.id} to={`/dashboard/groups/${group.id}`}>
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-border/60 hover:border-primary/50 group">
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span className="truncate">{group.name}</span>
                                                <LayoutDashboard className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                                {group.description || "No description provided"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>Created {format(new Date(group.created_at), "MMM d, yyyy")}</span>
                                                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-20 px-6 animate-fade-in-up">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary mb-6 shadow-sm ring-1 ring-primary/10">
                                <LayoutDashboard className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2">No site groups yet</h2>
                            <p className="text-muted-foreground text-center max-w-sm mb-8 text-lg">
                                Create a group to aggregate analytics from multiple sites.
                            </p>
                            <Button 
                                size="lg" 
                                className="shadow-lg shadow-primary/20"
                                onClick={() => setCreateDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Create your first group
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            <CreateSiteGroupDialog 
                open={createDialogOpen} 
                onOpenChange={setCreateDialogOpen} 
            />
        </DashboardLayout>
    );
}

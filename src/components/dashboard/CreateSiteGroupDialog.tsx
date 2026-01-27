import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSites } from "@/hooks/useSites";
import { useAuth } from "@/hooks/useAuth";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface CreateSiteGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateSiteGroupDialog({ open, onOpenChange }: CreateSiteGroupDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const { sites } = useSites();
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedSites, setSelectedSites] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast({
                title: "Name required",
                description: "Please enter a name for the group",
                variant: "destructive",
            });
            return;
        }

        if (selectedSites.length === 0) {
            toast({
                title: "Select sites",
                description: "Please select at least one site for the group",
                variant: "destructive",
            });
            return;
        }

        if (!user) return;

        setCreating(true);
        try {
            // Create the group
            const { data: group, error: groupError } = await supabase
                .from("site_groups")
                .insert({
                    name: name.trim(),
                    description: description.trim() || null,
                    user_id: user.id,
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // Add members
            const members = selectedSites.map((siteId) => ({
                group_id: group.id,
                site_id: siteId,
            }));

            const { error: membersError } = await supabase
                .from("site_group_members")
                .insert(members);

            if (membersError) throw membersError;

            toast({
                title: "Group created",
                description: `${name} has been created with ${selectedSites.length} site(s)`,
            });

            queryClient.invalidateQueries({ queryKey: ["site-groups"] });
            onOpenChange(false);
            setName("");
            setDescription("");
            setSelectedSites([]);
        } catch (error: any) {
            toast({
                title: "Error creating group",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    const toggleSite = (siteId: string) => {
        setSelectedSites((prev) =>
            prev.includes(siteId)
                ? prev.filter((id) => id !== siteId)
                : [...prev, siteId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Site Group</DialogTitle>
                    <DialogDescription>
                        Group multiple sites together to view aggregated analytics.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="groupName">Group Name</Label>
                        <Input
                            id="groupName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., All Marketing Sites"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="groupDescription">Description (optional)</Label>
                        <Textarea
                            id="groupDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A brief description of this group"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Select Sites</Label>
                        {sites.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No sites available. Create a site first.
                            </p>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border p-3">
                                {sites.map((site) => (
                                    <div
                                        key={site.id}
                                        className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                        onClick={() => toggleSite(site.id)}
                                    >
                                        <Checkbox
                                            checked={selectedSites.includes(site.id)}
                                            onCheckedChange={() => toggleSite(site.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{site.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{site.domain}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedSites.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {selectedSites.length} site(s) selected
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating || sites.length === 0}>
                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Group
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

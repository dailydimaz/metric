import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { Layout, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardCustomizerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentWidgets: Set<string> | null;
    onApply: (widgets: string[] | null) => void;
    siteId?: string;
}

const ALL_WIDGETS = [
    { id: "realtime", label: "Realtime stats", category: "Live" },
    { id: "visitors", label: "Stats: Visitors", category: "Core" },
    { id: "pageviews", label: "Stats: Pageviews", category: "Core" },
    { id: "bounce_rate", label: "Stats: Bounce Rate", category: "Core" },
    { id: "avg_duration", label: "Stats: Avg Duration", category: "Core" },
    { id: "visitor_chart", label: "Visitor Chart", category: "Charts" },
    { id: "top_pages", label: "Top Pages", category: "Content" },
    { id: "top_referrers", label: "Top Referrers", category: "Traffic" },
    { id: "funnels", label: "Funnels", category: "Conversion" },
    { id: "goals", label: "Goals", category: "Conversion" },
    { id: "retention", label: "Retention", category: "Engagement" },
    { id: "custom_events", label: "Custom Events", category: "Events" },
    { id: "device_stats", label: "Device Stats", category: "Tech" },
    { id: "utm_campaigns", label: "UTM Campaigns", category: "Traffic" },
    { id: "geo_stats", label: "Geo Stats", category: "Geography" },
    { id: "language_stats", label: "Language Stats", category: "Geography" },
    { id: "links", label: "Outbound Links", category: "Content" },
];

const STORAGE_KEY_PREFIX = "mmmetric_dashboard_";

// Get saved dashboard config from localStorage
function getSavedConfig(siteId?: string): string[] | null {
    if (!siteId) return null;
    try {
        const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${siteId}`);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn("Failed to load dashboard config:", e);
    }
    return null;
}

// Save dashboard config to localStorage
function saveConfig(siteId: string, widgets: string[] | null) {
    try {
        if (widgets === null) {
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}${siteId}`);
        } else {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${siteId}`, JSON.stringify(widgets));
        }
    } catch (e) {
        console.warn("Failed to save dashboard config:", e);
    }
}

export function DashboardCustomizer({ open, onOpenChange, currentWidgets, onApply, siteId }: DashboardCustomizerProps) {
    const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            // First try to load from localStorage
            const savedConfig = getSavedConfig(siteId);
            if (savedConfig) {
                setSelectedWidgets(savedConfig);
            } else if (currentWidgets) {
                setSelectedWidgets(Array.from(currentWidgets));
            } else {
                // If no widgets param, all are selected by default
                setSelectedWidgets(ALL_WIDGETS.map(w => w.id));
            }
        }
    }, [open, currentWidgets, siteId]);

    const toggleWidget = (id: string) => {
        setSelectedWidgets(prev =>
            prev.includes(id)
                ? prev.filter(w => w !== id)
                : [...prev, id]
        );
    };

    const toggleCategory = useCallback((category: string) => {
        const categoryWidgets = ALL_WIDGETS.filter(w => w.category === category);
        const allSelected = categoryWidgets.every(w => selectedWidgets.includes(w.id));
        
        if (allSelected) {
            setSelectedWidgets(prev => prev.filter(id => !categoryWidgets.some(w => w.id === id)));
        } else {
            setSelectedWidgets(prev => {
                const newSet = new Set(prev);
                categoryWidgets.forEach(w => newSet.add(w.id));
                return Array.from(newSet);
            });
        }
    }, [selectedWidgets]);

    const handleApply = () => {
        // Save to localStorage
        if (siteId) {
            if (selectedWidgets.length === ALL_WIDGETS.length) {
                saveConfig(siteId, null);
                onApply(null);
            } else {
                saveConfig(siteId, selectedWidgets);
                onApply(selectedWidgets);
            }
            toast({
                title: "Dashboard saved",
                description: "Your dashboard preferences have been saved.",
            });
        } else {
            // If all are selected, we can clear the param to keep URL clean
            if (selectedWidgets.length === ALL_WIDGETS.length) {
                onApply(null);
            } else {
                onApply(selectedWidgets);
            }
        }
        onOpenChange(false);
    };

    const handleReset = () => {
        setSelectedWidgets(ALL_WIDGETS.map(w => w.id));
        if (siteId) {
            saveConfig(siteId, null);
        }
    };

    // Group widgets by category
    const categories = Array.from(new Set(ALL_WIDGETS.map(w => w.category)));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5" />
                        Customize Dashboard
                    </DialogTitle>
                    <DialogDescription>
                        Select which widgets to display. Your preferences are saved locally.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-6 py-4">
                        {categories.map((category) => {
                            const categoryWidgets = ALL_WIDGETS.filter(w => w.category === category);
                            const allSelected = categoryWidgets.every(w => selectedWidgets.includes(w.id));
                            const someSelected = categoryWidgets.some(w => selectedWidgets.includes(w.id));
                            
                            return (
                                <div key={category} className="space-y-2">
                                    <div 
                                        className="flex items-center space-x-2 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => toggleCategory(category)}
                                    >
                                        <Checkbox
                                            checked={allSelected}
                                            className={someSelected && !allSelected ? "opacity-50" : ""}
                                        />
                                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                            {category}
                                        </span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                        {categoryWidgets.map((widget) => (
                                            <div key={widget.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                                <Checkbox
                                                    id={`widget-${widget.id}`}
                                                    checked={selectedWidgets.includes(widget.id)}
                                                    onCheckedChange={() => toggleWidget(widget.id)}
                                                />
                                                <Label
                                                    htmlFor={`widget-${widget.id}`}
                                                    className="flex-1 cursor-pointer font-medium"
                                                >
                                                    {widget.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="outline" onClick={handleReset}>
                        Reset Default
                    </Button>
                    <Button onClick={handleApply} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save & Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

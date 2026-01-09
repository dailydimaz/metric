import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnalyticsFilter } from "@/hooks/useAnalytics";
import { useSegments, Segment } from "@/hooks/useSegments";
import { Filter, X, Check, ChevronRight, ArrowLeft, Save, Bookmark, Trash2, Star, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterBarProps {
    filters: AnalyticsFilter;
    onFilterChange: (filters: AnalyticsFilter) => void;
    siteId?: string;
}

const FILTER_OPTIONS: { key: keyof AnalyticsFilter; label: string; placeholder: string }[] = [
    { key: "country", label: "Country", placeholder: "e.g. US, GB, DE" },
    { key: "browser", label: "Browser", placeholder: "e.g. Chrome, Firefox" },
    { key: "os", label: "OS", placeholder: "e.g. Windows, MacOS" },
    { key: "device", label: "Device", placeholder: "e.g. Desktop, Mobile" },
    { key: "url", label: "URL Path", placeholder: "e.g. /blog, /pricing" },
];

export function FilterBar({ filters, onFilterChange, siteId }: FilterBarProps) {
    const [open, setOpen] = useState(false);
    const [selectedFilterKey, setSelectedFilterKey] = useState<keyof AnalyticsFilter | null>(null);
    const [inputValue, setInputValue] = useState("");
    
    // Segments
    const { segments, createSegment, deleteSegment } = useSegments(siteId);
    const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [segmentName, setSegmentName] = useState("");
    const [segmentDescription, setSegmentDescription] = useState("");
    const [isDefaultSegment, setIsDefaultSegment] = useState(false);

    const handleSelectFilterType = (key: keyof AnalyticsFilter) => {
        setSelectedFilterKey(key);
        setInputValue(filters[key] || "");
    };

    const handleApplyFilter = () => {
        if (selectedFilterKey && inputValue.trim()) {
            onFilterChange({ ...filters, [selectedFilterKey]: inputValue.trim() });
            setActiveSegment(null); // Clear active segment when filters change
            resetState();
        }
    };

    const removeFilter = (key: keyof AnalyticsFilter) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFilterChange(newFilters);
        setActiveSegment(null);
    };

    const resetState = () => {
        setOpen(false);
        setSelectedFilterKey(null);
        setInputValue("");
    };

    const handleBack = () => {
        setSelectedFilterKey(null);
        setInputValue("");
    };

    const handleLoadSegment = (segment: Segment) => {
        onFilterChange(segment.filters);
        setActiveSegment(segment);
    };

    const handleSaveSegment = () => {
        if (!segmentName.trim()) return;
        
        createSegment.mutate({
            name: segmentName.trim(),
            description: segmentDescription.trim() || undefined,
            filters,
            isDefault: isDefaultSegment,
        }, {
            onSuccess: () => {
                setSaveDialogOpen(false);
                setSegmentName("");
                setSegmentDescription("");
                setIsDefaultSegment(false);
            }
        });
    };

    const handleDeleteSegment = (segment: Segment) => {
        deleteSegment.mutate(segment.id);
        if (activeSegment?.id === segment.id) {
            setActiveSegment(null);
        }
    };

    const activeFilterCount = Object.keys(filters).filter(k =>
        k !== "referrerPattern" && filters[k as keyof AnalyticsFilter]
    ).length;

    const currentFilterOption = FILTER_OPTIONS.find(f => f.key === selectedFilterKey);
    const hasFilters = activeFilterCount > 0;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Filter Button */}
            <Popover open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    setTimeout(() => {
                        setSelectedFilterKey(null);
                        setInputValue("");
                    }, 200);
                }
            }}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
                        <Filter className="h-3.5 w-3.5" />
                        Filter
                        {activeFilterCount > 0 && (
                            <span className="ml-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                    {!selectedFilterKey ? (
                        <Command>
                            <CommandInput placeholder="Filter by..." />
                            <CommandList>
                                <CommandEmpty>No filter found.</CommandEmpty>
                                <CommandGroup heading="Filters">
                                    {FILTER_OPTIONS.map((option) => {
                                        const isActive = !!filters[option.key];
                                        return (
                                            <CommandItem
                                                key={option.key}
                                                onSelect={() => handleSelectFilterType(option.key)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isActive && <Check className="h-4 w-4 text-primary" />}
                                                    <span className={!isActive ? "pl-6" : ""}>{option.label}</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    ) : (
                        <div className="p-3 space-y-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -ml-1"
                                    onClick={handleBack}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium">
                                    {currentFilterOption?.label}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <Input
                                    autoFocus
                                    placeholder={currentFilterOption?.placeholder}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleApplyFilter();
                                        }
                                    }}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={handleApplyFilter}
                                        disabled={!inputValue.trim()}
                                    >
                                        Apply Filter
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {/* Segments Dropdown */}
            {siteId && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2">
                            <Bookmark className="h-3.5 w-3.5" />
                            {activeSegment ? activeSegment.name : "Segments"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        {segments.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                No saved segments yet
                            </div>
                        ) : (
                            segments.map((segment) => (
                                <DropdownMenuItem
                                    key={segment.id}
                                    className="flex items-center justify-between group"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        handleLoadSegment(segment);
                                    }}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {segment.is_default && (
                                            <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                        )}
                                        <span className="truncate">{segment.name}</span>
                                        {activeSegment?.id === segment.id && (
                                            <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSegment(segment);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuItem>
                            ))
                        )}
                        {hasFilters && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setSaveDialogOpen(true)}>
                                    <Save className="h-3.5 w-3.5 mr-2" />
                                    Save current filters
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Active Filters */}
            {Object.entries(filters).map(([key, value]) => {
                if (!value || key === "referrerPattern") return null;
                const option = FILTER_OPTIONS.find(f => f.key === key);
                return (
                    <div
                        key={key}
                        className="group flex items-center gap-1.5 rounded-full border bg-background pl-3 pr-1.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted/50"
                    >
                        <span className="font-medium text-muted-foreground">
                            {option?.label || key}:
                        </span>
                        <span className="font-medium">{value}</span>
                        <button
                            onClick={() => removeFilter(key as keyof AnalyticsFilter)}
                            className="rounded-full p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={`Remove ${key} filter`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                );
            })}

            {activeFilterCount > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        onFilterChange({});
                        setActiveSegment(null);
                    }}
                >
                    Clear all
                </Button>
            )}

            {/* Save Segment Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Segment</DialogTitle>
                        <DialogDescription>
                            Save your current filters as a reusable segment for quick access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="segment-name">Name</Label>
                            <Input
                                id="segment-name"
                                value={segmentName}
                                onChange={(e) => setSegmentName(e.target.value)}
                                placeholder="e.g. Mobile US Users"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="segment-description">Description (optional)</Label>
                            <Input
                                id="segment-description"
                                value={segmentDescription}
                                onChange={(e) => setSegmentDescription(e.target.value)}
                                placeholder="e.g. Users from the US on mobile devices"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is-default"
                                checked={isDefaultSegment}
                                onCheckedChange={(checked) => setIsDefaultSegment(!!checked)}
                            />
                            <Label htmlFor="is-default" className="text-sm font-normal">
                                Set as default segment (auto-apply on load)
                            </Label>
                        </div>
                        <div className="rounded-md bg-muted p-3">
                            <p className="text-xs text-muted-foreground mb-2">Current filters:</p>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(filters).map(([key, value]) => {
                                    if (!value || key === "referrerPattern") return null;
                                    const option = FILTER_OPTIONS.find(f => f.key === key);
                                    return (
                                        <span key={key} className="text-xs bg-background px-2 py-1 rounded">
                                            {option?.label}: {value}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveSegment} 
                            disabled={!segmentName.trim() || createSegment.isPending}
                        >
                            {createSegment.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Segment'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
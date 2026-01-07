import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { AnalyticsFilter } from "@/hooks/useAnalytics";
import { Filter, X, Plus } from "lucide-react";

interface FilterBarProps {
    filters: AnalyticsFilter;
    onFilterChange: (filters: AnalyticsFilter) => void;
}

const FILTER_OPTIONS: { key: keyof AnalyticsFilter; label: string; placeholder: string }[] = [
    { key: "country", label: "Country", placeholder: "e.g. US, GB, DE" },
    { key: "browser", label: "Browser", placeholder: "e.g. Chrome, Firefox" },
    { key: "os", label: "OS", placeholder: "e.g. Windows, MacOS" },
    { key: "device", label: "Device", placeholder: "e.g. Desktop, Mobile" },
    { key: "url", label: "URL Path", placeholder: "e.g. /blog, /pricing" },
];

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const [activeFilter, setActiveFilter] = useState<keyof AnalyticsFilter | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [popoverOpen, setPopoverOpen] = useState(false);

    const handleAddFilter = () => {
        if (activeFilter && inputValue.trim()) {
            onFilterChange({ ...filters, [activeFilter]: inputValue.trim() });
            setActiveFilter(null);
            setInputValue("");
            setPopoverOpen(false);
        }
    };

    const handleSelectFilterType = (key: keyof AnalyticsFilter) => {
        setActiveFilter(key);
        setInputValue(filters[key] || "");
        setPopoverOpen(true);
    };

    const removeFilter = (key: keyof AnalyticsFilter) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFilterChange(newFilters);
    };

    const activeFilterCount = Object.keys(filters).filter(k => 
        k !== "referrerPattern" && filters[k as keyof AnalyticsFilter]
    ).length;

    const currentFilterOption = FILTER_OPTIONS.find(f => f.key === activeFilter);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
                            <Filter className="h-3.5 w-3.5" />
                            Filter
                            {activeFilterCount > 0 && (
                                <span className="ml-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[180px]">
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                            Add Filter
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {FILTER_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.key}
                                onClick={() => handleSelectFilterType(option.key)}
                                className="flex items-center justify-between"
                            >
                                {option.label}
                                {filters[option.key] && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                        {filters[option.key]}
                                    </span>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <PopoverTrigger asChild>
                    <span className="hidden" />
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-3" align="start">
                    {currentFilterOption && (
                        <div className="space-y-3">
                            <div className="text-sm font-medium">
                                {currentFilterOption.label} filter
                            </div>
                            <Input
                                autoFocus
                                placeholder={currentFilterOption.placeholder}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddFilter();
                                    } else if (e.key === "Escape") {
                                        setPopoverOpen(false);
                                    }
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPopoverOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddFilter}
                                    disabled={!inputValue.trim()}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Apply
                                </Button>
                            </div>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {/* Active Filters */}
            {Object.entries(filters).map(([key, value]) => {
                // Don't show referrerPattern as it's internal
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
                    onClick={() => onFilterChange({})}
                >
                    Clear all
                </Button>
            )}
        </div>
    );
}

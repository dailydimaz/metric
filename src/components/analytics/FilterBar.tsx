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
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { AnalyticsFilter } from "@/hooks/useAnalytics";
import { Filter, X, Plus, Check, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [open, setOpen] = useState(false);
    const [selectedFilterKey, setSelectedFilterKey] = useState<keyof AnalyticsFilter | null>(null);
    const [inputValue, setInputValue] = useState("");

    const handleSelectFilterType = (key: keyof AnalyticsFilter) => {
        setSelectedFilterKey(key);
        setInputValue(filters[key] || "");
    };

    const handleApplyFilter = () => {
        if (selectedFilterKey && inputValue.trim()) {
            onFilterChange({ ...filters, [selectedFilterKey]: inputValue.trim() });
            resetState();
        }
    };

    const removeFilter = (key: keyof AnalyticsFilter) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFilterChange(newFilters);
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

    const activeFilterCount = Object.keys(filters).filter(k =>
        k !== "referrerPattern" && filters[k as keyof AnalyticsFilter]
    ).length;

    const currentFilterOption = FILTER_OPTIONS.find(f => f.key === selectedFilterKey);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Popover open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    // Slight delay to allow animation to finish if needed, but instant reset is usually better for UX here
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

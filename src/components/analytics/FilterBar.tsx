import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AnalyticsFilter } from "@/hooks/useAnalytics";
import { Filter, X } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
    filters: AnalyticsFilter;
    onFilterChange: (filters: AnalyticsFilter) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const [activeTab, setActiveTab] = useState<keyof AnalyticsFilter | null>(null);
    const [tempValue, setTempValue] = useState("");

    const handleAddFilter = (key: keyof AnalyticsFilter, value: string) => {
        onFilterChange({ ...filters, [key]: value });
        setActiveTab(null);
        setTempValue("");
    };

    const removeFilter = (key: keyof AnalyticsFilter) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFilterChange(newFilters);
    };

    const activeFilterCount = Object.keys(filters).length;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
                        <Filter className="h-3.5 w-3.5" />
                        Filter
                        {activeFilterCount > 0 && (
                            <span className="ml-1 rounded-sm bg-primary/10 px-1 text-xs text-primary">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel>Add Filter</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveTab("country")}>
                        Country
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("browser")}>
                        Browser
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("os")}>
                        OS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("device")}>
                        Device
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("url")}>
                        URL Path
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Active Filters */}
            {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                return (
                    <div
                        key={key}
                        className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs shadow-sm hover:bg-muted/50"
                    >
                        <span className="font-medium text-muted-foreground capitalize">{key}:</span>
                        <span className="font-medium">{value}</span>
                        <button
                            onClick={() => removeFilter(key as keyof AnalyticsFilter)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
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
                    className="h-8 px-2 text-xs text-muted-foreground"
                    onClick={() => onFilterChange({})}
                >
                    Reset
                </Button>
            )}

            {/* Input Dialog (Simulated inline for now, can be sophisticated later) */}
            {activeTab && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <span className="text-sm font-medium capitalize whitespace-nowrap">
                        {activeTab} is:
                    </span>
                    <Input
                        autoFocus
                        className="h-8 w-[150px]"
                        placeholder="Enter value..."
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && tempValue) {
                                handleAddFilter(activeTab, tempValue);
                            } else if (e.key === "Escape") {
                                setActiveTab(null);
                            }
                        }}
                        onBlur={() => {
                            if (tempValue) handleAddFilter(activeTab, tempValue);
                            else setActiveTab(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

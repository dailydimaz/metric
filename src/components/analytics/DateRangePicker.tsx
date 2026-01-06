import { useState } from "react";
import { Calendar, Lock } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const options: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const { plan: subscriptionPlan } = useSubscription();
  const retentionDays = subscriptionPlan?.retentionDays || 7;

  const isOptionDisabled = (optionValue: DateRange) => {
    if (retentionDays === -1) return false;

    let days = 0;
    switch (optionValue) {
      case "today": days = 1; break;
      case "7d": days = 7; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
    }

    return days > retentionDays;
  };

  const handleSelect = (optionValue: DateRange) => {
    if (!isOptionDisabled(optionValue)) {
      onChange(optionValue);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          <span>{options.find(o => o.value === value)?.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <ul className="space-y-1">
          {options.map((option) => {
            const disabled = isOptionDisabled(option.value);
            return (
              <li key={option.value}>
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                    ${value === option.value ? "bg-accent text-accent-foreground" : "hover:bg-muted"}
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => handleSelect(option.value)}
                  disabled={disabled}
                >
                  {option.label}
                  {disabled && <Lock className="h-3 w-3 ml-2" />}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

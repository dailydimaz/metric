import { Calendar, Lock } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { useSubscription } from "@/hooks/useSubscription";

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


  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-2">
        <Calendar className="h-4 w-4" />
        <span>{options.find(o => o.value === value)?.label}</span>
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-52 z-50">
        {options.map((option) => {
          const disabled = isOptionDisabled(option.value);
          return (
            <li key={option.value} className={disabled ? "opacity-50" : ""}>
              <button
                className={`flex items-center justify-between ${value === option.value ? "active" : ""} ${disabled ? "cursor-not-allowed" : ""}`}
                onClick={() => !disabled && onChange(option.value)}
                disabled={disabled}
              >
                {option.label}
                {disabled && <Lock className="h-3 w-3 ml-2" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

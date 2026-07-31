import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Accessible name; required because filters have no visible label. */
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean | undefined;
}

/** Single dropdown-filter affordance shared by every list screen. */
export function FilterSelect({
  value,
  onChange,
  options,
  label,
  placeholder,
  className,
  disabled,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled ?? false}>
      <SelectTrigger className={cn("w-full", className)} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Builds `[{ value: 'all', label }, ...]` filter options from a label map. */
export function optionsFromLabels(
  labels: Record<string, string>,
  allLabel: string,
): FilterOption[] {
  return [
    { value: "all", label: allLabel },
    ...Object.entries(labels).map(([value, label]) => ({ value, label })),
  ];
}

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name; required because the field has no visible label. */
  label: string;
  maxLength?: number;
  className?: string;
}

/** Single search affordance shared by every list screen (identical icon, sizing and a11y). */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  maxLength = 100,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        aria-label={label}
        maxLength={maxLength}
        className="pl-9"
      />
    </div>
  );
}

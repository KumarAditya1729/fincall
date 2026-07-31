import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CallButtonProps {
  phone: string | null | undefined;
  label?: string;
  onCallStart?: () => void;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
}

/** Click-to-call: opens the device dialer and notifies the parent so a call can be logged. */
export function CallButton({
  phone,
  label,
  onCallStart,
  size = "sm",
  variant = "outline",
}: CallButtonProps) {
  const sanitized = (phone ?? "").replace(/[^\d+]/g, "");
  if (!sanitized) {
    return (
      <Button size={size} variant={variant} disabled aria-label="No phone number on file">
        <Phone className="size-4" aria-hidden="true" />
        {label ? <span>{label}</span> : null}
      </Button>
    );
  }

  return (
    <Button size={size} variant={variant} asChild>
      <a href={`tel:${sanitized}`} onClick={onCallStart} aria-label={`Call ${sanitized}`}>
        <Phone className="size-4" aria-hidden="true" />
        {label ? <span>{label}</span> : null}
      </a>
    </Button>
  );
}

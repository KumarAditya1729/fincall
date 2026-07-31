import { useState } from "react";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallButtonProps {
  phone: string | null | undefined;
  label?: string;
  onCallStart?: () => void;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
}

/** Click-to-call: opens the device dialer and displays a reminder dialog to log the call. */
export function CallButton({
  phone,
  label,
  onCallStart,
  size = "sm",
  variant = "outline",
}: CallButtonProps) {
  const [open, setOpen] = useState(false);
  const sanitized = (phone ?? "").replace(/[^\d+]/g, "");

  if (!sanitized) {
    return (
      <Button size={size} variant={variant} disabled aria-label="No phone number on file">
        <Phone className="size-4" aria-hidden="true" />
        {label ? <span>{label}</span> : null}
      </Button>
    );
  }

  const handleCallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Launch the tel protocol
    window.location.href = `tel:${sanitized}`;
    // Show reminder dialog
    setOpen(true);
    if (onCallStart) {
      onCallStart();
    }
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={handleCallClick} aria-label={`Call ${sanitized}`}>
        <Phone className="size-4" aria-hidden="true" />
        {label ? <span>{label}</span> : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="size-5 text-brand animate-pulse" />
              कॉल शुरू की गई है (Call Initiated)
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2 pt-2">
              <p>
                कॉल समाप्त होने के बाद, कृपया बातचीत का विवरण (कॉल स्टेटस, रिमार्क्स, या PTP) दर्ज करना न भूलें।
              </p>
              <p className="text-muted-foreground text-xs">
                Once your call is complete, please record the log using the <strong>Log call</strong> button on the customer page.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              ठीक है (OK)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


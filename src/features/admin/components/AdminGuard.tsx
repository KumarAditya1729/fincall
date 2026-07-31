import type { ReactNode } from "react";

import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES } from "@/constants";
import { hasRole, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { AppRole } from "@/types";

interface AdminGuardProps {
  children: ReactNode;
  /** Roles allowed to see the screen; defaults to super admins only. */
  roles?: AppRole[];
}

/**
 * Hides administration screens from users without the required role.
 *
 * This is presentation only — every table and routine behind these screens is
 * independently protected by row level security and role checks in the
 * database, so a user who bypasses this component still cannot read or write.
 */
export function AdminGuard({ children, roles = [ROLES.SUPER_ADMIN] }: AdminGuardProps) {
  const { data: user, isLoading, error, refetch } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => void refetch()} title="Couldn't load your access" />;
  }

  if (!hasRole(user, ...roles)) {
    return (
      <ErrorState
        error="You do not have permission to open this administration screen."
        title="Access restricted"
      />
    );
  }

  return <>{children}</>;
}

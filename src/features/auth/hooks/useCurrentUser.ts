import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants";
import { fetchCurrentUser } from "@/features/auth/services/authService";
import type { AppRole, CurrentUser } from "@/types";

export function useCurrentUser(): UseQueryResult<CurrentUser | null> {
  return useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: false,
  });
}

export function hasRole(user: CurrentUser | null | undefined, ...roles: AppRole[]): boolean {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

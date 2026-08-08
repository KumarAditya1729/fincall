import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/constants";

export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Channel for invalidating dashboard queries when related tables change
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executiveDashboard });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branchPerformance });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executiveDashboard });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.callTrend });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentActivity });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "followups" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executiveDashboard });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branchPerformance });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.callTrend });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentActivity });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "remarks" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentActivity });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

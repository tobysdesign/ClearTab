import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UserPreferences } from "@shared/schema";

export function useAgentInit() {
  const [isInitFlowOpen, setIsInitFlowOpen] = useState(false);

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  useEffect(() => {
    // Force setup wizard to show for testing
    setIsInitFlowOpen(true);
  }, []);

  const closeInitFlow = () => {
    setIsInitFlowOpen(false);
  };

  const isFirstTime = !localStorage.getItem('dashboardInitialized') && !preferences?.initialized;

  return {
    isFirstTime,
    isInitFlowOpen,
    closeInitFlow,
  };
}

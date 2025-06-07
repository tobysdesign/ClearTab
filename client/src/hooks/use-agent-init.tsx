import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UserPreferences } from "@shared/schema";

export function useAgentInit() {
  const [isInitFlowOpen, setIsInitFlowOpen] = useState(false);

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  useEffect(() => {
    const isInitialized = localStorage.getItem('dashboardInitialized') === 'true';
    const hasPreferences = preferences?.initialized;
    
    if (!isInitialized && !hasPreferences) {
      setIsInitFlowOpen(true);
    } else {
      setIsInitFlowOpen(false);
    }
  }, [preferences]);

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

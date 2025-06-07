import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UserPreferences } from "@shared/schema";

export function useAgentInit() {
  const [isInitFlowOpen, setIsInitFlowOpen] = useState(false);

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  useEffect(() => {
    // Clear localStorage to ensure fresh setup
    localStorage.removeItem('dashboardInitialized');
    
    const isInitialized = localStorage.getItem('dashboardInitialized') === 'true';
    const hasPreferences = preferences?.initialized;
    
    // Show wizard if no preferences exist or not initialized
    if (!hasPreferences || !isInitialized) {
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

"use client";

import * as React from "react";
import { usePreferences } from "@/hooks/use-preferences";
import { useWeatherUnit, type TemperatureUnit } from "@/hooks/use-weather-unit";
import sharedStyles from "./settings-shared.module.css";
import drawerStyles from "./settings-drawer.module.css";
import { SearchIcon } from "@/components/icons";
import { Select, SelectItem, useToast } from "@cleartab/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";

interface WeatherSettingsProps {
  sectionId: string;
  heading: string;
  description?: string;
}

export const WeatherSettings = React.forwardRef<
  HTMLElement,
  WeatherSettingsProps
>(function WeatherSettings({ sectionId, heading, description }, ref) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = React.useState("");
  const { unit, setUnit } = useWeatherUnit();

  // Load current preferences
  const { data: prefs, isLoading } = usePreferences();

  // Sync state with loaded preferences
  React.useEffect(() => {
    if (prefs?.location) {
      setQuery(prefs.location);
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: async (newLocation: string) => {
      const res = await apiFetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: newLocation }),
      });
      if (!res.ok) throw new Error("Failed to save location");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      queryClient.invalidateQueries({ queryKey: ["weather"] });
      toast({
        title: "Location updated",
        description: `Weather will now show for ${query}`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to save location",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    saveMutation.mutate(query.trim());
  };

  return (
    <section
      ref={ref}
      className={sharedStyles.card}
      data-section-id={sectionId}
    >
      <div className={drawerStyles.sectionHeading}>
        <h2 className={drawerStyles.sectionTitle}>{heading}</h2>
        {description ? (
          <p className={drawerStyles.sectionDescription}>{description}</p>
        ) : null}
      </div>
      <form
        className={`${sharedStyles.innerCard} ${sharedStyles.fieldGrid}`}
        onSubmit={handleSubmit}
      >
        <div className={`${sharedStyles.field} ${sharedStyles.fieldGrow}`}>
          <span className={sharedStyles.label}>Set location</span>

          <div className={sharedStyles.inputGroup}>
            <span className={sharedStyles.inputGroupIcon}>
              <SearchIcon size={16} aria-hidden />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a city (e.g. London, UK)"
              className={sharedStyles.inputGroupField}
              disabled={isLoading || saveMutation.isPending}
            />
          </div>
          <p className={sharedStyles.helpText} style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Press Enter to save your location
          </p>
        </div>

        <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
          <span className={sharedStyles.label}>Display unit</span>

          <Select
            id="weather-units"
            value={unit}
            onValueChange={(val) => {
              const nextUnit = val as TemperatureUnit;
              setUnit(nextUnit);
              toast({
                title: "Display unit updated",
                description: `Weather will now show in ${nextUnit === "fahrenheit" ? "Fahrenheit (°F)" : "Celsius (°C)"}.`,
              });
            }}
            className={sharedStyles.selectAuto}
          >
            <SelectItem value="celsius">Celsius</SelectItem>
            <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
          </Select>
        </div>
      </form>
    </section>
  );
});

WeatherSettings.displayName = "WeatherSettings";

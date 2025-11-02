"use client";

import * as React from "react";
import sharedStyles from "./settings-shared.module.css";
import drawerStyles from "./settings-drawer.module.css";
import { SearchIcon } from "@/components/icons";

type TemperatureUnit = "celsius" | "fahrenheit";

interface WeatherSettingsProps {
  sectionId: string;
  heading: string;
  description?: string;
}

export const WeatherSettings = React.forwardRef<
  HTMLElement,
  WeatherSettingsProps
>(function WeatherSettings({ sectionId, heading, description }, ref) {
  const [query, setQuery] = React.useState("");
  const [unit, setUnit] = React.useState<TemperatureUnit>("celsius");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Searching for location:", query);
    // TODO: hook into real location search once the data service is ready.
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
              placeholder="Type to search"
              className={sharedStyles.inputGroupField}
            />
          </div>
        </div>

        <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
          <span className={sharedStyles.label}>Display unit</span>

          <select
            id="weather-units"
            value={unit}
            onChange={(event) => setUnit(event.target.value as TemperatureUnit)}
            className={`${sharedStyles.input} ${sharedStyles.inputSelect} ${sharedStyles.selectAuto}`}
          >
            <option value="celsius">Celsius</option>
            <option value="fahrenheit">Fahrenheit</option>
          </select>
        </div>
      </form>
    </section>
  );
});

WeatherSettings.displayName = "WeatherSettings";

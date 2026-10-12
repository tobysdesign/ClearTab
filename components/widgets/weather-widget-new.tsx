"use client";

import { useState, useRef, useEffect } from "react";
import { usePreferences } from "@/hooks/use-preferences";
import { useWeatherUnit } from "@/hooks/use-weather-unit";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./weather-widget-new.module.css";
import { getWeatherIcon } from "./WeatherIcons";
import { useWidgetHeight } from "@/hooks/use-widget-height";
import { WidgetContainer, WidgetLoader } from "@cleartab/ui";
import { apiFetch } from "@/lib/api-fetch";
import type { WeatherData } from "@/lib/weather-service";

// "Sydney NSW, Australia" -> "Sydney NSW": the card leads with the place
// name alone (like iOS Weather), so drop the trailing country.
function placeName(location?: string) {
  if (!location) return "";
  const i = location.lastIndexOf(",");
  return i === -1 ? location : location.slice(0, i).trim();
}

export function WeatherWidgetNew() {
  const [cards, setCards] = useState<WeatherData[]>([]);

  const { ref, isMini } = useWidgetHeight();

  // 1. Fetch preferences to get location and display unit
  const { data: prefs } = usePreferences();
  const { unit } = useWeatherUnit();

  const location = prefs?.location || "Sydney, NSW";
  const units = unit === "fahrenheit" ? "IMPERIAL" : "METRIC";

  // 2. Fetch real weather data
  const { data, isLoading, error } = useQuery({
    queryKey: ["weather", location, units],
    queryFn: async () => {
      const response = await apiFetch(`/api/weather?${new URLSearchParams({ location, units })}`);
      const result: { success?: boolean; data?: WeatherData[]; error?: string } = await response
        .json()
        .catch(() => ({}));

      if (response.ok && result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || "Failed to fetch weather");
    },
    enabled: !!location,
  });

  // The card stack is local (clicking rotates it), seeded from the query. Seeding inside
  // queryFn left it empty whenever the widget remounted with the data already cached.
  useEffect(() => {
    if (data) setCards(data);
  }, [data]);

  // A piece of state to hold the card we're removing, to add it back later
  const [exitingCard, setExitingCard] = useState<WeatherData | null>(null);

  const handleCardClick = () => {
    // Prevent new animations while one is already in progress
    if (exitingCard || cards.length === 0) return;

    const topCard = cards[cards.length - 1]; // Get the last card (blue/top card)
    setExitingCard(topCard); // Store the card that is leaving
    setCards((prev) => prev.slice(0, -1)); // Remove the last card from array
  };

  const handleExitComplete = () => {
    if (!exitingCard) return;
    // Add the card that just finished its exit animation to the front of the array
    setCards((prev) => [exitingCard, ...prev]);
    setExitingCard(null); // Clear the exiting card state
  };

  const currentData = cards[cards.length - 1]; // The visible card (top of stack)

  if (isLoading || cards.length === 0) {
    return (
      <div ref={ref} className={styles.container}>
        <WidgetContainer>
          <WidgetLoader className="Weather" />
        </WidgetContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={ref} className={styles.container}>
        <WidgetContainer>
          <div className={styles.errorState}>
            <p>Weather unavailable</p>
          </div>
        </WidgetContainer>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={styles.container}
      whileHover="hover"
      initial="rest"
      animate="rest"
      style={{ pointerEvents: exitingCard ? "none" : "auto" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isMini ? (
          <motion.div
            key="mini"
            className={styles.modeWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <WidgetContainer
              onClick={handleCardClick}
              className={styles.miniButton}
            >
              <div className={styles.miniContainer}>
                <span className={styles.miniLocation}>
                  {currentData.location || "Loading..."}
                </span>

                <div className={styles.miniRight}>
                  <span className={styles.miniTemp}>
                    {!currentData.isForecast && currentData.temperature !== undefined
                      ? `${currentData.temperature}°`
                      : currentData.forecast?.[0]?.high !== undefined
                      ? `${currentData.forecast[0].high}°`
                      : ""}
                  </span>

                  <div className={styles.miniIconContainer}>
                    {getWeatherIcon(
                      currentData.forecast
                        ? currentData.forecast[0].condition
                        : currentData.condition,
                    )}
                  </div>
                </div>
              </div>
            </WidgetContainer>
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            className={styles.modeWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <AnimatePresence onExitComplete={handleExitComplete}>
          {cards.map((day, index) => {
            // We only want to render the top 3 cards for the stack effect
            if (index > 2) return null;

            return (
              <motion.div
                key={day.label}
                style={{
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  height: "calc(100% - 40px)",
                  zIndex: index === 0 ? 1 : index === 1 ? 2 : 3,
                }}
                animate={{
                  top: index === 0 ? 10 : index === 1 ? 20 : 40,
                }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
              >
                <motion.div
                  style={{
                    width: "100%",
                    height: "100%",
                    transformOrigin: "top center",
                  }}
                  variants={{
                    rest: { rotate: 0 },
                    hover: {
                      rotate: index === 0 ? 8 : index === 1 ? -12 : 0,
                    },
                  }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 200,
                      damping: 30,
                      mass: 1.2,
                    },
                    rotate: {
                      type: "spring",
                      stiffness: 200,
                      damping: 30,
                      mass: 1.2,
                    },
                    default: {
                      type: "spring",
                      stiffness: 200,
                      damping: 30,
                      mass: 1.2,
                    },
                  }}
                >
                  <motion.div
                    className={styles.card}
                    style={{
                      width: "100%",
                      height: "100%",
                      transformOrigin: "top center",
                      cursor: "pointer",
                    }}
                    animate={{
                      scale: index === 0 ? 0.64 : index === 1 ? 0.8 : 1,
                      opacity: index === 2 ? 1 : index === 1 ? 0.7 : 0.5,
                      rotate: 0,
                    }}
                    exit={{ y: 100, opacity: 0, scale: 0.9 }}
                    transition={{
                      type: "spring",
                      stiffness: 120,
                      damping: 20,
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCardClick}
                  >
                    {day.isForecast ? (
                      <>
                        <div className={styles.cardHeader}>
                          <div className={styles.place}>
                            {placeName(day.location)}
                          </div>
                          <div className={styles.date}>{day.label}</div>
                        </div>
                        <div className={styles.forecastGrid}>
                          {day.forecast?.map((item, i) => (
                            <div key={i} className={styles.forecastDay}>
                              <div className={styles.forecastDayLabel}>
                                {item.day}
                              </div>
                              <div className={styles.forecastIcon}>
                                {getWeatherIcon(item.condition)}
                              </div>
                              <div className={styles.forecastTemp}>
                                <span className={styles.forecastHigh}>
                                  {item.high}°
                                </span>
                                <span className={styles.forecastLow}>
                                  {item.low}°
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      // Header: place + day. Body: big temp with High/Low
                      // underneath on the left; icon + condition on the right
                      <div className={styles.dayCard}>
                        <div className={styles.dayHeader}>
                          <span className={styles.place}>
                            {placeName(day.location)}
                          </span>
                          <span className={styles.date}>{day.label}</span>
                        </div>
                        <div className={styles.dayBody}>
                          <div className={styles.dayMain}>
                            <div className={styles.bigTemp}>
                              {day.temperature}°
                            </div>
                            <div className={styles.hiLo}>
                              <div className={styles.hiLoItem}>
                                <span className={styles.hiLoValue}>
                                  {day.high}°
                                </span>
                                <span className={styles.hiLoLabel}>High</span>
                              </div>
                              <div className={styles.hiLoItem}>
                                <span className={styles.hiLoValue}>
                                  {day.low}°
                                </span>
                                <span className={styles.hiLoLabel}>Low</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.daySide}>
                            <div className={styles.weatherIconContainer}>
                              {getWeatherIcon(day.condition)}
                            </div>
                            {/* Condition sits with the icon it describes */}
                            <div className={styles.conditionText}>
                              {day.condition}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  );
}

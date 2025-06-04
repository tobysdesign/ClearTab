import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface CityWeatherData {
  city: string;
  temperature: number;
  description: string;
  rainChance: number;
  high: number;
  low: number;
  forecast: Array<{
    time: number;
    temperature: number;
    rainChance: number;
    weatherCode: number;
  }>;
}

export default function WeatherWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { data: cities, isLoading, error } = useQuery<CityWeatherData[]>({
    queryKey: ["/api/weather/cities"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  if (isLoading) {
    return (
      <div className="widget weather-widget h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">Weather</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Loading weather...</p>
        </div>
      </div>
    );
  }

  if (error || !cities || cities.length === 0) {
    return (
      <div className="widget weather-widget h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">Weather</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Weather unavailable</p>
        </div>
      </div>
    );
  }

  const weatherCards = cities.map(city => ({
    title: city.city,
    temp: `${city.temperature}°`,
    description: city.description,
    location: `${city.rainChance}% rain • ${city.high}°/${city.low}°`,
    forecast: city.forecast
  }));

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % weatherCards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + weatherCards.length) % weatherCards.length);
  };

  const currentCard = weatherCards[currentIndex];

  return (
    <div className="widget weather-widget h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">Weather</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={prevCard}
            className="h-4 w-4 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={nextCard}
            className="h-4 w-4 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col"
      >
        <div className="space-y-3">
          <div className="text-left">
            <div className="text-xs text-text-muted font-medium mb-2">{currentCard.title}</div>
            <div className="text-3xl font-light text-text-primary">
              {currentCard.temp}
            </div>
            <div className="text-sm text-text-secondary mb-3">
              {currentCard.description}
            </div>
            <div className="text-xs text-text-muted">
              {currentCard.location}
            </div>
          </div>
          
          {/* 12-hour forecast ticker */}
          {currentCard.forecast && currentCard.forecast.length > 0 && (
            <div className="mt-4 overflow-hidden">
              <div className="text-xs text-text-muted mb-2">Next 12 hours</div>
              <div className="relative">
                <div className="flex space-x-3 overflow-x-auto scrollbar-none">
                  {currentCard.forecast.map((hour, index) => (
                    <div key={index} className="flex-shrink-0 text-center min-w-[40px]">
                      <div className="text-xs text-text-muted mb-1">
                        {hour.time === 0 ? '12AM' : hour.time <= 12 ? `${hour.time}${hour.time === 12 ? 'PM' : 'AM'}` : `${hour.time - 12}PM`}
                      </div>
                      <div className="text-sm font-medium text-text-primary mb-1">
                        {hour.temperature}°
                      </div>
                      <div className="text-xs text-text-muted">
                        {hour.rainChance}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex justify-start space-x-1 mt-4">
        {weatherCards.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              index === currentIndex ? 'bg-foreground' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
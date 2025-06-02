import { useQuery } from "@tanstack/react-query";
import { CloudSun, Thermometer, Droplets } from "lucide-react";

interface WeatherData {
  temperature: number;
  description: string;
  high: number;
  low: number;
  humidity: number;
  location: string;
}

export default function WeatherWidget() {
  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="widget">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Weather</h2>
          <CloudSun className="h-5 w-5 text-text-secondary" />
        </div>
        <div className="text-center animate-pulse">
          <div className="h-12 w-16 bg-muted rounded mx-auto mb-2"></div>
          <div className="h-4 w-24 bg-muted rounded mx-auto mb-3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-12 bg-muted rounded"></div>
                <div className="h-3 w-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Weather</h2>
          <CloudSun className="h-5 w-5 text-text-secondary" />
        </div>
        <div className="text-center text-text-muted">
          <CloudSun className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Weather unavailable</p>
          <p className="text-xs mt-1">Check your API key</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Weather</h2>
        <CloudSun className="h-5 w-5 text-text-secondary" />
      </div>
      
      {weather && (
        <>
          <div className="text-center">
            <div className="text-3xl font-light mb-2 text-text-primary">
              {weather.temperature}°
            </div>
            <div className="text-sm text-text-secondary mb-3 capitalize">
              {weather.description}
            </div>
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <Thermometer className="h-3 w-3" />
                  <span>High</span>
                </div>
                <span>{weather.high}°</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <Thermometer className="h-3 w-3" />
                  <span>Low</span>
                </div>
                <span>{weather.low}°</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <Droplets className="h-3 w-3" />
                  <span>Humidity</span>
                </div>
                <span>{weather.humidity}%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-3 border-t border-border">
            <p className="text-xs text-text-muted text-center">
              {weather.location}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

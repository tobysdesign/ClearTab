'use server'

import { action } from '@/lib/safe-action';
import { z } from 'zod';
import { ActionResponse } from '@/types/actions';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const WEATHER_BASE_URL = 'https://weather.googleapis.com/v1';
const GEOCODE_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

const fetchWeatherSchema = z.object({
  location: z.string().optional().default('Sydney, NSW'),
  units: z.enum(['METRIC', 'IMPERIAL']).optional().default('METRIC'),
});

export interface WeatherData {
  label: string;
  location: string;
  isForecast?: boolean;
  temperature?: string;
  condition: string;
  high?: string;
  low?: string;
  forecast?: Array<{
    day: string;
    condition: string;
    high: string;
    low: string;
  }>;
}

// Map Google Weather conditions to our readable labels
function mapCondition(googleCondition: string): string {
  // Common mappings - Google uses UPPER_SNAKE_CASE
  const mappings: Record<string, string> = {
    'CLEAR': 'Sunny',
    'MOSTLY_CLEAR': 'Mostly sunny',
    'PARTLY_CLOUDY': 'Partly cloudy',
    'MOSTLY_CLOUDY': 'Mostly cloudy',
    'CLOUDY': 'Cloudy',
    'OVERCAST': 'Overcast',
    'SCATTERED_SHOWERS': 'Showers',
    'SHOWERS': 'Rain',
    'RAIN': 'Rain',
    'HEAVY_RAIN': 'Heavy rain',
    'THUNDERSTORM': 'Thunderstorm',
    'SNOW': 'Snow',
    'FOG': 'Foggy',
    'WINDY': 'Windy',
    'HAZE': 'Haze',
  };

  return mappings[googleCondition] || googleCondition.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

async function getCoordinates(location: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  
  const url = `${GEOCODE_BASE_URL}?address=${encodeURIComponent(location)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    const errorMsg = data.error_message ? `: ${data.error_message}` : '';
    console.error(`❌ Geocoding error [${data.status}]${errorMsg}`);
    throw new Error(`Geocoding failed for "${location}": ${data.status}${errorMsg}`);
  }

  if (!data.results[0]) {
    throw new Error(`No results found for "${location}"`);
  }

  return {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng,
    formatted_address: data.results[0].formatted_address,
  };
}

export const fetchWeather = action
  .schema(fetchWeatherSchema)
  .action(async ({ parsedInput }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    try {
      if (!apiKey) {
        return {
          success: false,
          error: 'Weather API Key missing. Please set GOOGLE_MAPS_API_KEY in .env.local and restart the server.',
        } as ActionResponse<null>;
      }

      const { location, units } = parsedInput;
      const coords = await getCoordinates(location);

      // 1. Fetch Current Conditions (GET request)
      const currentUrl = new URL(`${WEATHER_BASE_URL}/currentConditions:lookup`);
      currentUrl.searchParams.set('key', apiKey!);
      currentUrl.searchParams.set('location.latitude', coords.lat.toString());
      currentUrl.searchParams.set('location.longitude', coords.lng.toString());
      currentUrl.searchParams.set('unitsSystem', units);

      const currentRes = await fetch(currentUrl.toString());
      if (!currentRes.ok) throw new Error(`Weather API Current: ${currentRes.statusText}`);
      const currentData = await currentRes.json();

      // 2. Fetch Forecast (GET request)
      const forecastUrl = new URL(`${WEATHER_BASE_URL}/forecast/days:lookup`);
      forecastUrl.searchParams.set('key', apiKey!);
      forecastUrl.searchParams.set('location.latitude', coords.lat.toString());
      forecastUrl.searchParams.set('location.longitude', coords.lng.toString());
      forecastUrl.searchParams.set('unitsSystem', units);
      forecastUrl.searchParams.set('days', '5');

      const forecastRes = await fetch(forecastUrl.toString());
      if (!forecastRes.ok) throw new Error(`Weather API Forecast: ${forecastRes.statusText}`);
      const forecastData = await forecastRes.json();

      // 3. Map to our internal UI format
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const mappedForecast = (forecastData.forecastDays || []).map((day: any) => {
        const date = new Date(day.displayDate.year, day.displayDate.month - 1, day.displayDate.day);
        return {
          day: days[date.getDay()],
          condition: mapCondition(day.daytimeForecast?.weatherCondition?.type || 'CLEAR'),
          high: Math.round(day.maxTemperature?.degrees || 0).toString(),
          low: Math.round(day.minTemperature?.degrees || 0).toString(),
        };
      });

      // Assemble the final array of cards for the widget stack
      // The widget expects [ForecastCard, TomorrowCard, TodayCard]
      const results: WeatherData[] = [
        {
          label: '5 Day Forecast',
          location: coords.formatted_address,
          isForecast: true,
          condition: 'Forecast',
          forecast: mappedForecast,
        },
        {
          label: 'Tomorrow',
          location: coords.formatted_address,
          temperature: mappedForecast[1]?.high || '0',
          condition: mappedForecast[1]?.condition || 'Sunny',
          high: mappedForecast[1]?.high || '0',
          low: mappedForecast[1]?.low || '0',
        },
        {
          label: 'Today',
          location: coords.formatted_address,
          temperature: Math.round(currentData.temperature?.degrees || 0).toString(),
          condition: mapCondition(currentData.weatherCondition?.type || 'CLEAR'),
          high: mappedForecast[0]?.high || '0',
          low: mappedForecast[0]?.low || '0',
        }
      ];

      return {
        success: true,
        data: results,
      } as ActionResponse<WeatherData[]>;

    } catch (error: any) {
      console.error('❌ Error in fetchWeather:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch weather data.',
      } as ActionResponse<null>;
    }
  });

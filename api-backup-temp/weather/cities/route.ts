import { NextResponse } from 'next/server'

const CITIES = {
  'São Paulo': { lat: -23.5505, lon: -46.6333 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Singapore': { lat: 1.3521, lon: 103.8198 },
  'Wellington': { lat: -41.2866, lon: 174.7756 }
}

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  main: string;
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
  rainChance: number;
}

const cache = new Map<string, { data: WeatherData[]; timestamp: number }>()
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('forceRefresh') === 'true'
  const apiKey = process.env.TOMORROW_IO_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Weather API key not configured',
        message: 'Please provide a valid Tomorrow.io API key'
      },
      { status: 500 }
    )
  }

  const cacheKey = 'all_cities'
  const cachedEntry = cache.get(cacheKey)

  if (cachedEntry && !forceRefresh) {
    const isCacheValid = Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS
    if (isCacheValid) {
      return NextResponse.json(cachedEntry.data)
    }
  }

  try {
    const weatherPromises = Object.entries(CITIES).map(async ([city, coords]) => {
      const url = `https://api.tomorrow.io/v4/weather/realtime?location=${coords.lat},${coords.lon}&apikey=${apiKey}&units=metric`
      
      const response = await fetch(url)
      if (!response.ok) {
        // Try to parse the error response from the API
        const errorBody = await response.text()
        console.error(`Tomorrow.io API error for ${city}: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Failed to fetch weather for ${city}. Status: ${response.status}`)
      }
      
      const data = await response.json()
      const weather = data.data.values

      return {
        location: city,
        temperature: Math.round(weather.temperature),
        description: getWeatherDescription(weather.weatherCode),
        main: getWeatherMain(weather.weatherCode),
        humidity: Math.round(weather.humidity),
        windSpeed: Math.round(weather.windSpeed),
        high: Math.round(weather.temperature + 3), // Placeholder
        low: Math.round(weather.temperature - 3),  // Placeholder
        rainChance: Math.round(weather.precipitationProbability),
      }
    })

    const weatherData = await Promise.all(weatherPromises)
    
    cache.set(cacheKey, { data: weatherData, timestamp: Date.now() })

    return NextResponse.json(weatherData)
    
  } catch (error) {
    console.error('Weather API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

function getWeatherMain(code: number): string {
  if (code <= 1000) return 'Clear'
  if (code <= 1102) return 'Clouds'
  if (code <= 4201) return 'Rain'
  if (code <= 5101) return 'Storm'
  if (code <= 6201) return 'Snow'
  if (code <= 7102) return 'Wind'
  return 'Clouds'
}

function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    1000: 'Clear',
    1100: 'Mostly Clear',
    1101: 'Partly Cloudy',
    1102: 'Mostly Cloudy',
    2000: 'Fog',
    2100: 'Light Fog',
    3000: 'Light Wind',
    3001: 'Wind',
    3002: 'Strong Wind',
    4000: 'Drizzle',
    4001: 'Rain',
    4200: 'Light Rain',
    4201: 'Heavy Rain',
    5000: 'Snow',
    5001: 'Flurries',
    5100: 'Light Snow',
    5101: 'Heavy Snow',
    6000: 'Freezing Drizzle',
    6001: 'Freezing Rain',
    6200: 'Light Freezing Rain',
    6201: 'Heavy Freezing Rain',
    7000: 'Ice Pellets',
    7101: 'Heavy Ice Pellets',
    7102: 'Light Ice Pellets',
    8000: 'Thunderstorm'
  }
  
  return descriptions[code] || 'Unknown'
} 
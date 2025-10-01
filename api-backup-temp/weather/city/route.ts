import { NextResponse } from 'next/server'

interface WeatherData {
  temperature: number
  description: string
  high: number
  low: number
  humidity: number
  rainChance: number
  location: string
  main: string
  windSpeed?: number
}

const cache = new Map<string, { data: WeatherData; timestamp: number }>()
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

const CITIES = {
  'Sydney': { lat: -33.8688, lon: 151.2093 },
  'Melbourne': { lat: -37.8136, lon: 144.9631 },
  'Brisbane': { lat: -27.4698, lon: 153.0251 },
  'Perth': { lat: -31.9505, lon: 115.8605 },
  'Adelaide': { lat: -34.9285, lon: 138.6007 },
  'Hobart': { lat: -42.8821, lon: 147.3272 },
  'Darwin': { lat: -12.4634, lon: 130.8456 },
  'Canberra': { lat: -35.2809, lon: 149.1300 }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') || 'Sydney'
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

  const coords = CITIES[city as keyof typeof CITIES]
  if (!coords) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid city',
        message: `Weather data not available for ${city}`
      },
      { status: 400 }
    )
  }

  const cacheKey = city
  const cachedEntry = cache.get(cacheKey)

  if (cachedEntry && !forceRefresh) {
    const isCacheValid = Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS
    if (isCacheValid) {
      return NextResponse.json(cachedEntry.data)
    }
  }

  try {
    const options = {
      method: 'GET',
      headers: {accept: 'application/json', 'accept-encoding': 'deflate, gzip, br'}
    }

    // Fetch both realtime and forecast data
    const [realtimeResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${coords.lat},${coords.lon}&apikey=${apiKey}&units=metric`, options),
      fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${coords.lat},${coords.lon}&apikey=${apiKey}&units=metric&timesteps=1d`, options)
    ])
    
    if (!realtimeResponse.ok || !forecastResponse.ok) {
      throw new Error(`Failed to fetch weather for ${city}`)
    }
    
    const [realtimeData, forecastData] = await Promise.all([
      realtimeResponse.json(),
      forecastResponse.json()
    ])

    const weather = realtimeData.data.values
    const dailyForecast = forecastData.timelines?.daily?.[0]?.values || {}

    const responseData: WeatherData = {
      location: city,
      temperature: Math.round(weather.temperature),
      description: getWeatherDescription(weather.weatherCode),
      main: getWeatherMain(weather.weatherCode),
      humidity: Math.round(weather.humidity),
      windSpeed: Math.round(weather.windSpeed),
      high: Math.round(dailyForecast.temperatureMax || weather.temperature + 3),
      low: Math.round(dailyForecast.temperatureMin || weather.temperature - 3),
      rainChance: Math.round(weather.precipitationProbability),
    }
    
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData)
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
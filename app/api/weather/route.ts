import { NextRequest, NextResponse } from 'next/server'
import { ActionResponse } from '@/types/actions'

interface WeatherData {
  temperature: number
  description: string
  high: number
  low: number
  humidity: number
  rainChance: number
  location: string
  main: string
}

// Note: The multi-city POST endpoint is not updated to OpenWeatherMap yet.
// It still uses Tomorrow.io and will not work without a TOMORROW_IO_API_KEY.
// This will be addressed in a future update if needed.
interface WeatherForecast {
  time: number
  temperature: number
  rainChance: number
  weatherCode: number
}

interface CityWeatherData extends WeatherData {
  city: string
  forecast: WeatherForecast[]
}

const cache = new Map<string, { data: WeatherData; timestamp: number }>()
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

const weatherCodes: Record<number, string> = {
  0: "Unknown",
  1000: "Clear, Sunny",
  1100: "Mostly Clear",
  1101: "Partly Cloudy",
  1102: "Mostly Cloudy",
  1001: "Cloudy",
  2000: "Fog",
  2100: "Light Fog",
  4000: "Drizzle",
  4001: "Rain",
  4200: "Light Rain",
  4201: "Heavy Rain",
  5000: "Snow",
  5001: "Flurries",
  5100: "Light Snow",
  5101: "Heavy Snow",
  6000: "Freezing Drizzle",
  6001: "Freezing Rain",
  6200: "Light Freezing Rain",
  6201: "Heavy Freezing Rain",
  7000: "Ice Pellets",
  7101: "Heavy Ice Pellets",
  7102: "Light Ice Pellets",
  8000: "Thunderstorm"
}

function getWeatherDescription(code: number): string {
  return weatherCodes[code] || "Unknown Weather"
}

function getWeatherMain(code: number): string {
  if (code === 1000) return 'Clear'
  if (code >= 1001 && code <= 1102) return 'Clouds'
  if (code >= 4000 && code <= 4201) return 'Rain'
  if (code >= 5000 && code <= 5101) return 'Snow' // Assuming you might add a snow icon later
  if (code >= 6000 && code <= 6201) return 'Rain'
  if (code >= 7000 && code <= 7102) return 'Snow' // Ice pellets, mapping to snow
  if (code === 8000) return 'Rain' // Thunderstorm, mapping to rain
  return 'Clouds' // Default
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ActionResponse<WeatherData>>> {
  try {
    const { searchParams } = new URL(request.url)
    let lat = searchParams.get('lat')
    let lon = searchParams.get('lon')
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
    
    if (!lat || !lon) {
      const ip = request.headers.get('x-forwarded-for') || '8.8.8.8'
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon`)
        if (!geoResponse.ok) {
          // Default to San Francisco coordinates if IP geolocation fails
          lat = '37.7749'
          lon = '-122.4194'
        } else {
          const geoData = await geoResponse.json()
          lat = geoData.lat.toString()
          lon = geoData.lon.toString()
        }
      } catch (error) {
        // Default to San Francisco coordinates if IP geolocation fails
        lat = '37.7749'
        lon = '-122.4194'
      }
    }

    if (!lat || !lon) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Could not determine location.',
        },
        { status: 400 }
      )
    }
    
    const cacheKey = `${lat},${lon}`
    const cachedEntry = cache.get(cacheKey)

    if (cachedEntry && !forceRefresh) {
      const isCacheValid = Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS
      if (isCacheValid) {
        return NextResponse.json({
          success: true,
          data: cachedEntry.data,
        })
      }
    }
    
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'accept-encoding': 'deflate, gzip, br',
      },
    }

    const [realtimeResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}&units=metric`, options),
      fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${apiKey}&units=metric&timesteps=1d`, options)
    ])

    if (!realtimeResponse.ok) {
      const errorData = await realtimeResponse.text()
      throw new Error(`Tomorrow.io Realtime API error: ${realtimeResponse.status} - ${errorData}`)
    }
    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.text()
      throw new Error(`Tomorrow.io Forecast API error: ${forecastResponse.status} - ${errorData}`)
    }
    
    const realtimeData = await realtimeResponse.json()
    const forecastData = await forecastResponse.json()
    
    const currentValues = realtimeData.data.values
    const locationName = realtimeData.location.name || 'Unknown location'
    const dailyForecast = forecastData.timelines?.daily?.[0]?.values || {}

    const responseData: WeatherData = {
        temperature: Math.round(currentValues.temperature),
        description: getWeatherDescription(currentValues.weatherCode),
        high: Math.round(dailyForecast.temperatureMax || currentValues.temperature),
        low: Math.round(dailyForecast.temperatureMin || currentValues.temperature),
        humidity: Math.round(currentValues.humidity),
        rainChance: Math.round(currentValues.precipitationProbability || 0),
        location: locationName,
        main: getWeatherMain(currentValues.weatherCode),
    }
    
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })
    
    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<CityWeatherData[]>>> {
  try {
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
    
    const cities = [
      { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
      { name: "New York", lat: 40.7128, lon: -74.0060 },
      { name: "London", lat: 51.5074, lon: -0.1278 }
    ]
    
    const weatherPromises = cities.map(async (city) => {
      try {
        const options = {
          method: 'GET',
          headers: {accept: 'application/json', 'accept-encoding': 'deflate, gzip, br'}
        };
        // Get current weather and 12-hour forecast
        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${city.lat},${city.lon}&apikey=${apiKey}&units=metric`, options),
          fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${city.lat},${city.lon}&apikey=${apiKey}&units=metric&timesteps=1h`, options)
        ])
        
        if (!currentResponse.ok || !forecastResponse.ok) {
          throw new Error(`Weather API error for ${city.name}`)
        }
        
        const [currentData, forecastData] = await Promise.all([
          currentResponse.json(),
          forecastResponse.json()
        ])
        
        const weather = currentData.data.values
        const forecast = forecastData.data?.timelines?.[0]?.intervals?.slice(1, 13) || []
        
        return {
          city: city.name,
          temperature: Math.round(weather.temperature),
          description: getWeatherDescription(weather.weatherCode),
          rainChance: Math.round(weather.precipitationProbability || 0),
          high: Math.round(weather.temperatureMax || weather.temperature + 5),
          low: Math.round(weather.temperatureMin || weather.temperature - 5),
          humidity: Math.round(weather.humidity || 0),
          location: city.name,
          forecast: forecast.map((interval: any) => ({
            time: new Date(interval.startTime).getHours(),
            temperature: Math.round(interval.values.temperature),
            rainChance: Math.round(interval.values.precipitationProbability || 0),
            weatherCode: interval.values.weatherCode
          }))
        }
      } catch (error) {
        console.error(`Weather API error for ${city.name}:`, error)
        return null
      }
    })
    
    const weatherData = await Promise.all(weatherPromises)
    const validWeatherData = weatherData.filter((data): data is CityWeatherData => data !== null)
    
    if (!validWeatherData.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch weather data for all cities'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: validWeatherData
    })
  } catch (error) {
    console.error('Multi-city weather API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch multi-city weather data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
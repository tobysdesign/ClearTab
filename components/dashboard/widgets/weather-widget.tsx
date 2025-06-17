'use client'

import { useState, useEffect } from 'react'
import { Sun, Cloud, CloudRain, LocateFixed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch weather data.')
          }
          const data = await response.json()
          setWeather(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Unable to retrieve your location.')
        setLoading(false)
      }
    )
  }

  function renderWeatherIcon(main: string) {
    switch (main) {
      case 'Clear':
        return <Sun className="h-8 w-8 text-yellow-400" />
      case 'Clouds':
        return <Cloud className="h-8 w-8 text-gray-400" />
      case 'Rain':
        return <CloudRain className="h-8 w-8 text-blue-400" />
      default:
        return <Cloud className="h-8 w-8 text-gray-400" />
    }
  }

  return (
    <Card className="h-full flex flex-col border border-border">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 px-6 pt-6 pb-1.5">
        <CardTitle>Current Weather</CardTitle>
        {weather && !loading && (
          <Button variant="ghost" size="icon" onClick={fetchWeather}>
            <LocateFixed className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto relative">
        <div className="flex items-center justify-center h-full">
          {loading && <p>Loading weather...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!weather && !loading && !error && (
            <Button onClick={fetchWeather}>
              <LocateFixed className="mr-2 h-4 w-4" /> Get Weather
            </Button>
          )}
          {weather && (
            <div className="flex items-center space-x-4">
              {renderWeatherIcon(weather.weather[0].main)}
              <div>
                <p className="text-2xl font-bold">{Math.round(weather.main.temp)}°C</p>
                <p className="text-sm text-muted-foreground">{weather.weather[0].description}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface Weather {
  weather: {
    main: string
    description: string
  }[]
  main: {
    temp: number
  }
} 
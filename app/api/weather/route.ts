import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Weather API key is not configured.' },
      { status: 500 }
    )
  }

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required.' },
      { status: 400 }
    )
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenWeatherMap API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch weather data from external service.' },
        { status: response.status }
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching weather data:', error)
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
} 
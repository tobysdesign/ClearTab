import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.TOMORROW_IO_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: "Weather API key not configured",
      message: "Please provide a valid Tomorrow.io API key in environment variables"
    });
  }
  
  const cities = [
    { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "London", lat: 51.5074, lon: -0.1278 }
  ];
  
  try {
    const weatherPromises = cities.map(async (city) => {
      try {
        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${city.lat},${city.lon}&apikey=${apiKey}&units=metric`),
          fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${city.lat},${city.lon}&apikey=${apiKey}&units=metric&timesteps=1h`)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
          throw new Error(`Weather API error for ${city.name}`);
        }
        
        const [currentData, forecastData] = await Promise.all([
          currentResponse.json(),
          forecastResponse.json()
        ]);
        
        const weather = currentData.data.values;
        const forecast = forecastData.data?.timelines?.[0]?.intervals?.slice(1, 13) || [];
        
        return {
          city: city.name,
          temperature: Math.round(weather.temperature),
          description: getWeatherDescription(weather.weatherCode),
          rainChance: Math.round(weather.precipitationProbability || 0),
          high: Math.round(weather.temperatureMax || weather.temperature + 5),
          low: Math.round(weather.temperatureMin || weather.temperature - 5),
          forecast: forecast.map((interval: any) => ({
            time: new Date(interval.startTime).getHours(),
            temperature: Math.round(interval.values.temperature),
            rainChance: Math.round(interval.values.precipitationProbability || 0),
            weatherCode: interval.values.weatherCode
          }))
        };
      } catch (error) {
        console.error(`Weather API error for ${city.name}:`, error);
        return null;
      }
    });
    
    const weatherData = await Promise.all(weatherPromises);
    const validWeatherData = weatherData.filter(data => data !== null);
    
    return res.status(200).json(validWeatherData);
  } catch (error) {
    console.error("Multi-city weather API error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch multi-city weather data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

function getWeatherDescription(code: number): string {
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
  };
  
  return weatherCodes[code] || "Unknown";
}
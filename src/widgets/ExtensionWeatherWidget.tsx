import React from 'react'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  icon: string
  lastUpdated: Date
}

export const ExtensionWeatherWidget: React.FC = () => {
  const [weather, setWeather] = React.useState<WeatherData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Mock weather data for extension (since API calls might be restricted)
  const mockWeatherData: WeatherData = {
    location: 'San Francisco, CA',
    temperature: 72,
    condition: 'Partly Cloudy',
    icon: '⛅',
    lastUpdated: new Date()
  }

  // Load weather from storage or use mock data
  React.useEffect(() => {
    const loadWeather = async () => {
      setLoading(true)
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['weather'])
          if (result.weather) {
            setWeather(result.weather)
          } else {
            setWeather(mockWeatherData)
          }
        } else {
          const savedWeather = localStorage.getItem('extension-weather')
          if (savedWeather) {
            setWeather(JSON.parse(savedWeather))
          } else {
            setWeather(mockWeatherData)
          }
        }
      } catch (error) {
        console.warn('Extension: Failed to load weather:', error)
        setWeather(mockWeatherData)
        setError('Using offline data')
      } finally {
        setLoading(false)
      }
    }

    loadWeather()
  }, [])

  const refreshWeather = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real implementation, you'd make an API call here
      // For the extension, we'll simulate a refresh with updated mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      const updatedWeather = {
        ...mockWeatherData,
        temperature: Math.floor(Math.random() * 30) + 60, // Random temp between 60-90
        lastUpdated: new Date()
      }

      setWeather(updatedWeather)

      // Save to storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ weather: updatedWeather })
      } else {
        localStorage.setItem('extension-weather', JSON.stringify(updatedWeather))
      }
    } catch (error) {
      console.warn('Extension: Failed to refresh weather:', error)
      setError('Failed to update weather')
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    const icons: { [key: string]: string } = {
      'Sunny': '☀️',
      'Partly Cloudy': '⛅',
      'Cloudy': '☁️',
      'Rainy': '🌧️',
      'Stormy': '⛈️',
      'Snowy': '❄️',
      'Foggy': '🌫️'
    }
    return icons[condition] || '🌤️'
  }

  return (
    <div className="extension-widget">
      <div className="extension-widget-header">
        <h3 className="extension-widget-title">Weather</h3>
        <button
          onClick={refreshWeather}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            color: '#94a3b8',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      <div className="extension-widget-content">
        {loading && !weather && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}

        {weather && (
          <div>
            {/* Main weather display */}
            <div style={{
              textAlign: 'center',
              padding: '20px 0',
              borderBottom: '1px solid rgba(71, 85, 105, 0.2)',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '8px'
              }}>
                {getWeatherIcon(weather.condition)}
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '300',
                color: '#f1f5f9',
                marginBottom: '4px'
              }}>
                {weather.temperature}°F
              </div>
              <div style={{
                fontSize: '14px',
                color: '#94a3b8',
                marginBottom: '2px'
              }}>
                {weather.condition}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#64748b'
              }}>
                {weather.location}
              </div>
            </div>

            {/* Additional info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px'
            }}>
              <div style={{
                background: 'rgba(51, 65, 85, 0.3)',
                padding: '8px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#64748b', marginBottom: '2px' }}>
                  Feels like
                </div>
                <div style={{ color: '#f1f5f9', fontWeight: '500' }}>
                  {weather.temperature + 2}°F
                </div>
              </div>
              <div style={{
                background: 'rgba(51, 65, 85, 0.3)',
                padding: '8px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#64748b', marginBottom: '2px' }}>
                  Humidity
                </div>
                <div style={{ color: '#f1f5f9', fontWeight: '500' }}>
                  65%
                </div>
              </div>
            </div>

            {/* Last updated */}
            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(71, 85, 105, 0.2)',
              textAlign: 'center',
              fontSize: '11px',
              color: '#64748b'
            }}>
              Updated {weather.lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            {error && (
              <div style={{
                marginTop: '8px',
                padding: '6px 8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#ef4444',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {!weather && !loading && (
          <div className="extension-empty-state">
            <h3>Weather unavailable</h3>
            <p>Click refresh to try again</p>
          </div>
        )}
      </div>
    </div>
  )
}
import React from 'react'

// Placeholder weather widget for extension
// Will be implemented with actual weather functionality later
export const ExtensionWeatherWidget: React.FC = () => {
  return (
    <div className="extension-widget">
      <div className="widget-header">
        <h3>Weather</h3>
      </div>
      <div className="widget-content">
        <div className="weather-info">
          <div className="temp">72°F</div>
          <div className="condition">Sunny</div>
          <div className="location">San Francisco</div>
        </div>
      </div>
    </div>
  )
}
import React from 'react'

// Import simplified extension widgets that work without heavy dependencies
import { SimpleExtensionNotesWidget } from './widgets/SimpleExtensionNotesWidget'
import { SimpleExtensionTasksWidget } from './widgets/SimpleExtensionTasksWidget'
import { ExtensionWeatherWidget } from './components/ExtensionWeatherWidget'

// Import the state hook
import { useExtensionState } from './hooks/useExtensionState'

export const ExtensionDashboard: React.FC = () => {
  const { state } = useExtensionState()

  return (
    <div className="extension-dashboard">
      {/* Background */}
      <div className="extension-background" />

      {/* Main content */}
      <div className="extension-content">
        {/* Header */}
        <header className="extension-header">
          <div className="extension-time">
            <TimeDisplay />
          </div>
          <div className="extension-date">
            <DateDisplay />
          </div>
        </header>

        {/* Widgets grid */}
        <main className="extension-widgets">
          <div className="extension-widget-column">
            <SimpleExtensionNotesWidget />
          </div>

          <div className="extension-widget-column">
            <SimpleExtensionTasksWidget />
          </div>

          <div className="extension-widget-column">
            <ExtensionWeatherWidget />
          </div>
        </main>

        {/* Footer */}
        <footer className="extension-footer">
          <div className="extension-status">
            {state.error && (
              <span className="extension-error">
                Offline Mode
              </span>
            )}
            {state.isLoading && (
              <span className="extension-loading">
                Loading...
              </span>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

// Time display component
const TimeDisplay: React.FC = () => {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="time-display">
      {time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}
    </div>
  )
}

// Date display component
const DateDisplay: React.FC = () => {
  const [date] = React.useState(new Date())

  return (
    <div className="date-display">
      {date.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}
    </div>
  )
}
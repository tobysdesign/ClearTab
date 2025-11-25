'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './weather-widget-new.module.css'
import { PartlyCloudyIcon, SunIcon, CloudIcon, RainIcon } from '@/components/ui/weather-icons'
import { getWeatherIcon } from './WeatherIcons'

const weatherData = [
  {
    label: '5 Day Forecast',
    location: 'Sydney, NSW',
    isForecast: true,
    forecast: [
      { day: 'Thu', condition: 'Partly cloudy', high: '22', low: '4' },
      { day: 'Fri', condition: 'Sunny', high: '19', low: '5' },
      { day: 'Sat', condition: 'Cloudy', high: '20', low: '8' },
      { day: 'Sun', condition: 'Rain', high: '19', low: '9' },
      { day: 'Mon', condition: 'Partly cloudy', high: '18', low: '5' },
    ]
  },
  {
    label: 'Tomorrow',
    location: 'Sydney, NSW',
    temperature: '26',
    condition: 'Partly cloudy',
    high: '27',
    low: '5'
  },
  {
    label: 'Today',
    location: 'Sydney, NSW',
    temperature: '28',
    condition: 'Cloudy with low chance of rain',
    high: '29',
    low: '6'
  }
]

export function WeatherWidgetNew() {
  const [cards, setCards] = useState(weatherData)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // A piece of state to hold the card we're removing, to add it back later
  const [exitingCard, setExitingCard] = useState<typeof weatherData[0] | null>(null);

  const handleCardClick = () => {
    // Prevent new animations while one is already in progress
    if (exitingCard) return;

    const topCard = cards[cards.length - 1]; // Get the last card (blue/top card)
    setExitingCard(topCard); // Store the card that is leaving
    setCards(prev => prev.slice(0, -1)); // Remove the last card from array
  }

  const handleExitComplete = () => {
    if (!exitingCard) return;
    // Add the card that just finished its exit animation to the front of the array
    setCards(prev => [exitingCard, ...prev]);
    setExitingCard(null); // Clear the exiting card state
  }


  return (
    <motion.div
      ref={containerRef}
      className={styles.container}
      whileHover="hover"
      initial="rest"
      animate="rest"
      style={{ pointerEvents: exitingCard ? 'none' : 'auto' }}
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {cards.map((day, index) => {
          // We only want to render the top 3 cards for the stack effect
          if (index > 2) return null;

          return (
            <motion.div
              key={day.label}
              style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: 'calc(100% - 40px)',
                zIndex: index === 0 ? 1 : index === 1 ? 2 : 3,
              }}
              animate={{
                top: index === 0 ? 10 : index === 1 ? 20 : 40,
              }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 20,
              }}
            >
              <motion.div
                style={{
                  width: '100%',
                  height: '100%',
                  transformOrigin: 'top center',
                }}
                variants={{
                  rest: { rotate: 0 },
                  hover: { 
                    rotate: index === 0 ? 8 : index === 1 ? -12 : 0
                  }
                }}
                transition={{
                  layout: { type: "spring", stiffness: 200, damping: 30, mass: 1.2 },
                  rotate: { type: "spring", stiffness: 200, damping: 30, mass: 1.2 },
                  default: { type: "spring", stiffness: 200, damping: 30, mass: 1.2 }
                }}
              >
                <motion.div 
                  className={styles.card}
                style={{
                  width: '100%',
                  height: '100%',
                  transformOrigin: 'top center',
                  cursor: 'pointer',
                }}
                animate={{
                  scale: index === 0 ? 0.64 : index === 1 ? 0.8 : 1,
                  opacity: index === 2 ? 1 : index === 1 ? 0.7 : 0.5,
                  rotate: 0,
                }}
                exit={{ y: 100, opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCardClick}
              >
              <div className={styles.cardHeader}>
                <div className={styles.date}>{day.label}</div>
                <div className={styles.location}>{day.location}</div>
              </div>
              
              {day.isForecast ? (
                <div className={styles.forecastGrid}>
                  {day.forecast?.map((item, i) => (
                    <div key={i} className={styles.forecastDay}>
                      <div className={styles.forecastDayLabel}>{item.day}</div>
                      <div className={styles.forecastIcon}>
                        {getWeatherIcon(item.condition)}
                      </div>
                      <div className={styles.forecastTemp}>
                        <span className={styles.forecastHigh}>{item.high}°</span>
                        <span className={styles.forecastLow}>{item.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.weatherCardGrid}>
                  <div className={styles.leftCol}>
          
                    <div className={styles.bigTemp}>{day.temperature}°</div>
                    <div className={styles.tempRange}>
                      <span className={styles.highTemp}>{day.high}°</span>
                      {' / '}
                      <span className={styles.lowTemp}>{day.low}°</span>
                    </div>
                  </div>
                  <div className={styles.rightCol}>
                    
                    <div className={styles.weatherIconContainer}>
                      {getWeatherIcon(day.condition)}
                    </div>
                    <div className={styles.conditionText}>{day.condition}</div>
                  </div>
                </div>
              )}
                </motion.div>
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
} 
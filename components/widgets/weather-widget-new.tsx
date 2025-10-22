'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './weather-widget-new.module.css'
import { PartlyCloudyIcon, SunIcon, CloudIcon, RainIcon } from '@/components/ui/weather-icons'

const weatherData = [
  {
    label: 'Today',
    location: 'Sydney, NSW',
    temperature: '28',
    condition: 'Cloudy with low chance of rain',
    high: '29',
    low: '6',
    icon: 'partly-cloudy'
  },
  {
    label: 'Tomorrow',
    location: 'Sydney, NSW',
    temperature: '26',
    condition: 'Partly cloudy',
    high: '27',
    low: '5',
    icon: 'partly-cloudy'
  },
  {
    label: '5 Day Forecast',
    location: 'Sydney, NSW',
    isForecast: true,
    forecast: [
      { day: 'Thu', icon: 'partly-cloudy', high: '22', low: '4' },
      { day: 'Fri', icon: 'sun', high: '19', low: '5' },
      { day: 'Sat', icon: 'cloud', high: '20', low: '8' },
      { day: 'Sun', icon: 'rain', high: '19', low: '9' },
      { day: 'Mon', icon: 'partly-cloudy', high: '18', low: '5' },
    ]
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
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {cards.map((day, index) => {
          // We only want to render the top 3 cards for the stack effect
          if (index > 2) return null;

          return (
            <motion.div
              key={day.date}
              layout
              style={{
                position: 'absolute',
                left: '50%',
                width: 'calc(100% - 20px)',
                height: 'calc(100% - 40px)',
                transform: 'translateX(-50%)',
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
                layout
                style={{
                  width: '100%',
                  height: '100%',
                  transformOrigin: index === 0 ? 'bottom right' : index === 1 ? 'bottom left' : 'center',
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
                        {item.icon === 'sun' && <SunIcon size={40} />}
                        {item.icon === 'cloud' && <CloudIcon size={40} />}
                        {item.icon === 'partly-cloudy' && <PartlyCloudyIcon size={40} />}
                        {item.icon === 'rain' && <RainIcon size={40} />}
                      </div>
                      <div className={styles.forecastTemp}>
                        <span className={styles.forecastHigh}>{item.high}°</span>
                        {' '}
                        <span className={styles.forecastLow}>{item.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className={styles.cardCenter}>
                    {/* Weather icon */}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.mainTempCol}>
                      <div className={styles.temperature}>{day.temperature}°</div>
                      <div className={styles.condition}>{day.condition}</div>
                    </div>
                    <div className={styles.tempGroup}>
                      <div className={styles.tempCol}>
                        <div className={styles.highTemp}>{day.high}°</div>
                        <div className={styles.tempLabel}>High</div>
                      </div>
                      <div className={styles.tempCol}>
                        <div className={styles.lowTemp}>{day.low}°</div>
                        <div className={styles.tempLabel}>Low</div>
                      </div>
                    </div>
                  </div>
                </>
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
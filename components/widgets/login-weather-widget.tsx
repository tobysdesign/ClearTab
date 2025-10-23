'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './weather-widget-new.module.css'
import { getWeatherIcon } from './WeatherIcons'

const mockWeatherData = [
  {
    date: 'Today',
    fullDate: 'Tuesday 14th July',
    location: 'Sydney, NSW',
    temperature: '28',
    condition: 'Cloudy with low chance of rain',
    high: '29',
    low: '6'
  },
  {
    date: 'Tomorrow',
    fullDate: 'Wednesday 15th July',
    location: 'Sydney, NSW',
    temperature: '26',
    condition: 'Partly cloudy',
    high: '27',
    low: '5'
  }
]

const mockFiveDayData = [
  { day: 'Wed', condition: 'Partly cloudy', high: '27', low: '5' },
  { day: 'Thu', condition: 'Light rain', high: '25', low: '4' },
  { day: 'Fri', condition: 'Sunny', high: '30', low: '8' },
  { day: 'Sat', condition: 'Cloudy', high: '22', low: '3' },
  { day: 'Sun', condition: 'Thunder', high: '21', low: '2' }
]

export function LoginWeatherWidget() {
  const [cards] = useState(mockWeatherData)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div 
      ref={containerRef}
      className={styles.container}
      whileHover="hover"
      initial="rest"
      animate="rest"
      style={{ pointerEvents: 'none' }}
    >
      <AnimatePresence>
        {cards.map((day, index) => {
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
                zIndex: index === 0 ? 3 : 2,
              }}
              animate={{
                top: index === 0 ? 40 : 20,
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
                  transformOrigin: index === 0 ? 'bottom right' : 'bottom left',
                }}
                variants={{
                  rest: { rotate: 0 },
                  hover: { 
                    rotate: index === 0 ? 8 : -12
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
                    cursor: 'default',
                  }}
                  animate={{
                    scale: index === 0 ? 1 : 0.8,
                    opacity: index === 0 ? 1 : 0.7,
                    rotate: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 20,
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.date}>{day.date}</div>
                    <div className={styles.location}>{day.location}</div>
                  </div>
                  
                  <div className={styles.cardCenter}>
                    {getWeatherIcon(day.condition)}
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
                </motion.div>
              </motion.div>
            </motion.div>
          )
        })}
        
        {/* 5-Day Forecast Card */}
        <motion.div
          layout
          style={{
            position: 'absolute',
            left: '50%',
            width: 'calc(100% - 20px)',
            height: 'calc(100% - 40px)',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
          animate={{
            top: 10,
          }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
          }}
        >
          <motion.div 
            className={styles.card}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'default',
            }}
            animate={{
              scale: 0.64,
              opacity: 0.5,
            }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
            }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.date}>5-Day Forecast</div>
              <div className={styles.location}>Sydney, NSW</div>
            </div>
            
            <div className={styles.forecastGrid}>
              {mockFiveDayData.map((forecast, i) => (
                <div key={i} className={styles.forecastDay}>
                  <div className={styles.forecastDayLabel}>{forecast.day}</div>
                  <div className={styles.forecastIcon}>
                    {getWeatherIcon(forecast.condition)}
                  </div>
                  <div className={styles.forecastTemp}>
                    <span className={styles.forecastHigh}>{forecast.high}°</span>
                    <span className={styles.forecastLow}>{forecast.low}°</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

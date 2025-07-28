'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './weather-widget-new.module.css'

const weatherData = [
  {
    date: 'Tuesday 14th July',
    location: 'Sydney, NSW',
    temperature: '28',
    condition: 'Cloudy with low chance of rain',
    high: '29',
    low: '6'
  },
  {
    date: 'Wednesday 15th July',
    location: 'Sydney, NSW',
    temperature: '26',
    condition: 'Partly cloudy',
    high: '27',
    low: '5'
  },
  {
    date: 'Thursday 16th July',
    location: 'Sydney, NSW',
    temperature: '24',
    condition: 'Light rain',
    high: '25',
    low: '4'
  }
]

export function WeatherWidgetNew() {
  const [cards, setCards] = useState(weatherData)
  const [isHovered, setIsHovered] = useState(false)
  
  // A piece of state to hold the card we're removing, to add it back later
  const [exitingCard, setExitingCard] = useState<typeof weatherData[0] | null>(null);

  const handleCardClick = () => {
    // Prevent new animations while one is already in progress
    if (exitingCard) return;

    const topCard = cards[0];
    setExitingCard(topCard); // Store the card that is leaving
    setCards(prev => prev.slice(1)); // Remove it from the main array
  }

  const handleExitComplete = () => {
    if (!exitingCard) return;
    // Add the card that just finished its exit animation to the back of the array
    setCards(prev => [...prev, exitingCard]);
    setExitingCard(null); // Clear the exiting card state
  }

  return (
    <div 
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {cards.map((day, index) => {
          // We only want to render the top 3 cards for the stack effect
          if (index > 2) return null;

          return (
            <motion.div 
              key={day.date} // A stable key from the data itself
              className={styles.card}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 0,
                cursor: index === 0 ? 'pointer' : 'default',
                transformOrigin: 'center bottom',
              }}
              animate={{
                x: index === 0 ? '-50%' : 'calc(-50% + 0px)',
                y: index === 0 ? 0 : index === 1 ? -40 : -80,
                scale: index === 0 ? 1 : index === 1 ? 0.89 : 0.78,
                rotate: isHovered && index !== 0 ? (index === 1 ? -15 : 15) : 0,
                opacity: index === 0 ? 1 : index === 1 ? 0.7 : 0.4,
                zIndex: 3 - index, // Higher index in array = lower z-index
              }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 20,
              }}
              whileTap={index === 0 ? { scale: 0.98 } : {}}
              onClick={index === 0 ? handleCardClick : undefined}
            >
              <div className={styles.cardHeader}>
                <div className={styles.date}>{day.date}</div>
                <div className={styles.location}>{day.location}</div>
              </div>
              
              <div className={styles.cardCenter}>
                {/* Lottie animation will go here */}
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
          )
        })}
      </AnimatePresence>
    </div>
  )
} 
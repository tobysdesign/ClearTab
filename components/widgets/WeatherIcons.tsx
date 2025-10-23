import React from 'react'
import styles from './weather-icons.module.css'

export const CloudyIcon: React.FC = () => (
  <div className={styles.icon}>
    <div className={`${styles.cloud2} ${styles.smallCloud}`}></div>
    <div className={styles.cloud2}></div>
  </div>
)

export const RainyIcon: React.FC = () => (
  <div className={styles.icon}>
    <div className={styles.cloud2}></div>
    <div className={styles.rain}></div>
  </div>
)

export const ThunderIcon: React.FC = () => (
  <div className={styles.icon}>
    <div className={styles.cloud2}></div>
    <div className={styles.thunder}>
      <div className={styles.bolt}></div>
      <div className={styles.bolt}></div>
    </div>
  </div>
)

export const SunnyIcon: React.FC = () => (
  <div className={styles.icon}>
    <div className={styles.rays}>
      <div className={styles.ray}></div>
      <div className={styles.ray}></div>
      <div className={styles.ray}></div>
      <div className={styles.ray}></div>
    </div>
    <div className={styles.sun}></div>
  </div>
)

export const DrizzleIcon: React.FC = () => (
  <div className={styles.icon}>
    <div className={styles.cloud2}></div>
    <div className={styles.drizzle}></div>
  </div>
)

export const SnowIcon: React.FC = () => (
  <div className={styles.icon}>
    <div className={styles.cloud2}></div>
    <div className={styles.snow}>
      <div className={styles.flake}></div>
      <div className={styles.flake}></div>
      <div className={styles.flake}></div>
      <div className={styles.flake}></div>
    </div>
  </div>
)

export const WindyIcon: React.FC = () => (
  <div className={styles.icon}>
    <div className={`${styles.extreme} text-center`}>
      <div className={styles.harshWind}></div>
      <div className={styles.harshWind}></div>
      <div className={styles.harshWind}></div>
      <div className={styles.harshWind}></div>
      <div className={styles.harshWind}></div>
      <div className={styles.harshWind}></div>
      <div className={styles.harshWind}></div>
    </div>
  </div>
)

// Helper function to get the appropriate weather icon based on condition
export const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase()
  
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
    return <ThunderIcon />
  } else if (lowerCondition.includes('rain') && !lowerCondition.includes('drizzle')) {
    return <RainyIcon />
  } else if (lowerCondition.includes('drizzle')) {
    return <DrizzleIcon />
  } else if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) {
    return <SnowIcon />
  } else if (lowerCondition.includes('wind')) {
    return <WindyIcon />
  } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <CloudyIcon />
  } else if (lowerCondition.includes('sun') || lowerCondition.includes('clear') || lowerCondition.includes('fair')) {
    return <SunnyIcon />
  } else {
    // Default to cloudy for partly cloudy or unknown conditions
    return <CloudyIcon />
  }
}

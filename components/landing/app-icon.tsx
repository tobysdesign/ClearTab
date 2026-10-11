import { useId } from 'react'
import { EyesMarkIcon } from '@/components/icons'
import styles from './app-icon.module.css'

interface AppIconProps {
  /** rendered size in px */
  size?: number
  className?: string
}

/* ClearTab app icon: a dark squircle with a lighter tab shape rising from
   the bottom, and the ‹ơıơ› eyes sitting on the tab. */
export function AppIcon({ size = 48, className = '' }: AppIconProps) {
  const id = useId()
  const clipId = `${id}-clip`
  const tileId = `${id}-tile`
  const tabId = `${id}-tab`

  return (
    <span className={`${styles.icon} ${className}`} data-size={size > 40 ? 'large' : 'small'}>
      <svg
        className={styles.tile}
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect width="160" height="160" rx="42" />
          </clipPath>
          <linearGradient id={tileId} x1="80" y1="0" x2="80" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#353535" />
            <stop offset="1" stopColor="#222222" />
          </linearGradient>
          <linearGradient id={tabId} x1="80" y1="38" x2="80" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4a4a4a" />
            <stop offset="1" stopColor="#3a3a3a" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="160" height="160" fill={`url(#${tileId})`} />
          {/* Tab: rounded top corners, sides flaring out into the bottom edge */}
          <path
            d="M-2 160V146C12 146 24 136 24 120V64C24 49 34 38 50 38H110C126 38 136 49 136 64V120C136 136 148 146 162 146V160H-2Z"
            fill={`url(#${tabId})`}
          />
          <path
            d="M24 120V64C24 49 34 38 50 38H110C126 38 136 49 136 64V120"
            stroke="white"
            strokeOpacity="0.08"
            strokeWidth="1.5"
          />
        </g>
        <rect x="0.75" y="0.75" width="158.5" height="158.5" rx="41.25" stroke="white" strokeOpacity="0.07" strokeWidth="1.5" />
      </svg>
      <EyesMarkIcon size={Math.round(size * 0.5)} className={styles.eyes} />
    </span>
  )
}

export default AppIcon

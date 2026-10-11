interface IconProps {
  size?: number
  className?: string
}

export function CloudSunIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3v1.5M5.6 5.6l1 1M3 12h1.5M17.4 5.6l-1 1" />
      <path d="M8.5 11.5a4 4 0 0 1 7.6-1.7" />
      <path d="M8 21h9a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 14.5 3.25 3.25 0 0 0 8 21Z" />
    </svg>
  )
}

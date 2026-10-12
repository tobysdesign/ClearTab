interface IconProps {
  size?: number
  className?: string
}

export function HomeIcon({ size = 24, className = "" }: IconProps) {
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
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9v10.5h13V9" />
      <path d="M10 19.5v-5h4v5" />
    </svg>
  )
}

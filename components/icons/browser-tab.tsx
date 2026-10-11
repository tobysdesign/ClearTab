interface IconProps {
  size?: number
  className?: string
}

export function BrowserTabIcon({ size = 24, className = "" }: IconProps) {
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
      <rect x="2.5" y="4" width="19" height="16" rx="3" />
      <path d="M2.5 9h19M6 6.5h.01M8.5 6.5h.01M11 6.5h.01" />
    </svg>
  )
}

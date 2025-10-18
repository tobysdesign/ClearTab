interface IconProps {
  size?: number
  className?: string
}

export function CheckIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20.285 6.708l-11.667 11.667-5.208-5.209 1.414-1.414 3.794 3.794 10.253-10.253 1.414 1.415z"
        fill="currentColor"
      />
    </svg>
  )
}
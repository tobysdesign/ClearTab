interface IconProps {
  size?: number
  className?: string
}

export function TrashIcon({ size = 24, className = "" }: IconProps) {
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
        d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9zm4 2v9h1.5v-9H10zm2.5 0v9H14v-9h-1.5z"
        fill="currentColor"
      />
    </svg>
  )
}

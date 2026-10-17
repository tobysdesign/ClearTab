interface IconProps {
  size?: number
  className?: string
}

/** A square-node "layout tree": one panel branching into two — reads as
 *  arranging/splitting the dashboard's panels. */
export function LayoutTreeIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="9" width="6" height="6" rx="1.5" />
      <rect x="15.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="15.5" y="15.5" width="6" height="6" rx="1.5" />
      <path d="M8.5 12h3.5M12 5.5v13M12 5.5h3.5M12 18.5h3.5" />
    </svg>
  )
}

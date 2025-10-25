export function SunIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="16" fill="#FF9500" />
      <g stroke="#FF9500" strokeWidth="3" strokeLinecap="round">
        <line x1="32" y1="8" x2="32" y2="4" />
        <line x1="32" y1="60" x2="32" y2="56" />
        <line x1="8" y1="32" x2="4" y2="32" />
        <line x1="60" y1="32" x2="56" y2="32" />
        <line x1="14" y1="14" x2="11" y2="11" />
        <line x1="50" y1="50" x2="53" y2="53" />
        <line x1="50" y1="14" x2="53" y2="11" />
        <line x1="14" y1="50" x2="11" y2="53" />
      </g>
    </svg>
  );
}

export function CloudIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M48 36C52.4183 36 56 32.4183 56 28C56 23.5817 52.4183 20 48 20C47.6585 20 47.3206 20.0168 46.9871 20.0497C46.3589 13.8128 41.0802 9 34.6667 9C28.2531 9 22.9744 13.8128 22.3462 20.0497C22.0127 20.0168 21.6748 20 21.3333 20C16.9151 20 13.3333 23.5817 13.3333 28C13.3333 32.4183 16.9151 36 21.3333 36H48Z"
        fill="#B8C5D6"
      />
    </svg>
  );
}

export function PartlyCloudyIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="26" cy="22" r="10" fill="#FF9500" opacity="0.9" />
      <path
        d="M44 38C47.3137 38 50 35.3137 50 32C50 28.6863 47.3137 26 44 26C43.7488 26 43.5006 26.0127 43.2562 26.0376C42.7837 21.4497 38.9281 18 34.25 18C29.5719 18 25.7163 21.4497 25.2438 26.0376C24.9994 26.0127 24.7512 26 24.5 26C21.1863 26 18.5 28.6863 18.5 32C18.5 35.3137 21.1863 38 24.5 38H44Z"
        fill="#B8C5D6"
      />
    </svg>
  );
}

export function RainIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M44 32C47.3137 32 50 29.3137 50 26C50 22.6863 47.3137 20 44 20C43.7488 20 43.5006 20.0127 43.2562 20.0376C42.7837 15.4497 38.9281 12 34.25 12C29.5719 12 25.7163 15.4497 25.2438 20.0376C24.9994 20.0127 24.7512 20 24.5 20C21.1863 20 18.5 22.6863 18.5 26C18.5 29.3137 21.1863 32 24.5 32H44Z"
        fill="#B8C5D6"
      />
      <g stroke="#6FA8DC" strokeWidth="2.5" strokeLinecap="round">
        <line x1="24" y1="38" x2="24" y2="44" />
        <line x1="30" y1="40" x2="30" y2="48" />
        <line x1="36" y1="38" x2="36" y2="44" />
        <line x1="42" y1="40" x2="42" y2="48" />
      </g>
    </svg>
  );
}

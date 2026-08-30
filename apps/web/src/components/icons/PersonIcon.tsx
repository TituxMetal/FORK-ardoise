type Props = {
  className?: string
}

export const PersonIcon = ({ className = 'h-5 w-5' }: Props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="10" cy="7" r="3" fill="currentColor" opacity="0.9" />
    <path
      d="M4 17c0-3 3-4.5 6-4.5s6 1.5 6 4.5"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
)

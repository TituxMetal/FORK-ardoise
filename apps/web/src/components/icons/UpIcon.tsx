type Props = {
  className?: string
}

export const UpIcon = ({ className = 'h-5 w-5' }: Props) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M10 16V5m0 0L5 10m5-5 5 5" />
  </svg>
)

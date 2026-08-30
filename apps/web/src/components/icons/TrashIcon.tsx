type Props = {
  className?: string
}

export const TrashIcon = ({ className = 'h-5 w-5' }: Props) => (
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
    <path d="M4 6h12" />
    <path d="M8 6V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6" />
    <path d="M6.5 6l.6 9a1.5 1.5 0 0 0 1.5 1.4h2.8a1.5 1.5 0 0 0 1.5-1.4l.6-9" />
    <path d="M8.5 9.5v3M11.5 9.5v3" />
  </svg>
)

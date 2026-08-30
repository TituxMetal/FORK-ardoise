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
    <path d="M6 6v9a1 1 0 001 1h6a1 1 0 001-1V6" />
    <path d="M9 4h2l.5 2h-3L9 4z" />
  </svg>
)

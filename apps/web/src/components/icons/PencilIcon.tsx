type Props = {
  className?: string
}

export const PencilIcon = ({ className = 'h-5 w-5' }: Props) => (
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
    <path d="M14.5 3.5l2 2L7 15l-3 .5L4.5 12.5 14.5 3.5z" />
  </svg>
)

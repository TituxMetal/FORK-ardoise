type Props = {
  className?: string
}

export const PlusIcon = ({ className = 'h-6 w-6' }: Props) => (
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
    <path d="M10 4v12M4 10h12" />
  </svg>
)

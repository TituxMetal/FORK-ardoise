import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement>

export const Select = ({ className, ...rest }: Props) => (
  <select
    className={`rounded border border-zinc-600 bg-zinc-800 px-2 py-1 ${className ?? ''}`}
    {...rest}
  />
)

import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement>

export const Select = ({ className, ...rest }: Props) => (
  <select
    className={`h-11 rounded-lg border border-border bg-surface px-3 text-foreground disabled:opacity-50 ${className ?? ''}`}
    {...rest}
  />
)

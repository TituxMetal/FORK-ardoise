import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export const Input = ({ className, ...rest }: Props) => (
  <input
    className={`h-11 rounded-lg border border-border bg-surface px-3 text-foreground placeholder:text-dim disabled:opacity-50 ${className ?? ''}`}
    {...rest}
  />
)

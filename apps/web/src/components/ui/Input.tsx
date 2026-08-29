import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export const Input = ({ className, ...rest }: Props) => (
  <input
    className={`rounded border border-zinc-600 bg-zinc-800 px-2 py-1 ${className ?? ''}`}
    {...rest}
  />
)

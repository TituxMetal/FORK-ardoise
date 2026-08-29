import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export const Button = ({ className, variant = 'primary', ...rest }: Props) => (
  <button
    className={`${
      variant === 'primary'
        ? 'rounded bg-zinc-100 px-3 py-2 text-zinc-900'
        : 'rounded bg-zinc-800 px-3 py-2'
    } ${className ?? ''}`}
    {...rest}
  />
)

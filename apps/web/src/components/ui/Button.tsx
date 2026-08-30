import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export const Button = ({ className, variant = 'primary', ...rest }: Props) => (
  <button
    className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-3 font-semibold transition-colors ${
      variant === 'primary'
        ? 'bg-accent text-on-accent hover:bg-accent/90'
        : 'bg-surface text-foreground hover:bg-surface-2'
    } ${className ?? ''}`}
    {...rest}
  />
)

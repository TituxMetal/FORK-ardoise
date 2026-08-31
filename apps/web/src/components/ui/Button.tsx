import type { ComponentProps } from 'react'

type Props = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger'
}

export const Button = ({ className, variant = 'primary', ref, ...rest }: Props) => (
  <button
    ref={ref}
    className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-3 font-semibold transition-colors ${
      variant === 'primary'
        ? 'bg-accent text-on-accent hover:bg-accent/90'
        : variant === 'secondary'
          ? 'bg-surface text-foreground hover:bg-surface-2'
          : 'bg-negative text-background hover:bg-negative/90'
    } ${className ?? ''}`}
    {...rest}
  />
)

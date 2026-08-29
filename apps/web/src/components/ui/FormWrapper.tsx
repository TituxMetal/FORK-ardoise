import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

export const FormWrapper = ({ label, children }: Props) => (
  <label className="flex flex-col gap-1">
    {label}
    {children}
  </label>
)

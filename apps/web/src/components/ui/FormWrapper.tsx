import { Children, cloneElement, useId, type ReactElement } from 'react'

type ControlProps = {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

type Props = {
  label: string
  error?: string
  children: ReactElement<ControlProps>
}

export const FormWrapper = ({ label, error, children }: Props) => {
  const controlId = useId()
  const messageId = useId()
  const control = Children.only(children)
  const describedBy = error
    ? [messageId, control.props['aria-describedby']].filter(Boolean).join(' ')
    : control.props['aria-describedby']
  const id = control.props.id ?? controlId

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>{label}</label>
      {cloneElement(control, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined
      })}
      {error ? (
        <p id={messageId} className="text-sm text-negative" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

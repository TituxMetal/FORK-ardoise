type Props = {
  message: string
}

export const Alert = ({ message }: Props) => (
  <p className="text-negative" role="alert">
    {message}
  </p>
)

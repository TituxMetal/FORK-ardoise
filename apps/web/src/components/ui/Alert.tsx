type Props = {
  message: string
}

export const Alert = ({ message }: Props) => (
  <p className="text-red-400" role="alert">
    {message}
  </p>
)

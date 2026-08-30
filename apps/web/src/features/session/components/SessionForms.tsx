import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

export const SessionForms = () => (
  <div className="space-y-8">
    <SignUpForm />
    <SignInForm />
  </div>
)

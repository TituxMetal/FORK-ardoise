export type SessionUser = {
  id: string
  name: string
}

export type SignUpInput = {
  email: string
  password: string
  name: string
}

export type Auth = {
  handler: (request: Request) => Promise<Response>
  getSessionUser: (headers: Headers) => Promise<SessionUser | null>
}

/**
 * better-auth's own sign-up, a separate capacity so the session readers — the
 * middleware, the web test harness — never have to carry account creation.
 */
export type AuthSignUp = {
  /** Creates a User through better-auth, so the stored password hash is real. */
  signUp: (input: SignUpInput) => Promise<SessionUser>
}

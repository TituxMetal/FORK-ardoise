export type SessionUser = {
  id: string
  name: string
}

export type Auth = {
  handler: (request: Request) => Promise<Response>
  getSessionUser: (headers: Headers) => Promise<SessionUser | null>
}

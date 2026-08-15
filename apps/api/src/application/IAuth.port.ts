export const IAuth = Symbol('IAuth')

export type SessionUser = {
  id: string
  name: string
}

export type IAuth = {
  handler: (request: Request) => Promise<Response>
  getSessionUser: (headers: Headers) => Promise<SessionUser | null>
}

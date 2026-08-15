export const IAuth = Symbol('IAuth')

export type IAuth = {
  handler: (request: Request) => Promise<Response>
  getSessionUserId: (headers: Headers) => Promise<string | null>
}

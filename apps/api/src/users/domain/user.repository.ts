export type UserRepository = {
  /** Renames a User and propagates the name to every Member seat they sit in. */
  rename: (userId: string, name: string) => Promise<void>
}

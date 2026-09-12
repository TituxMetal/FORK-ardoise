export type UserRepository = {
  /** Renames a User and propagates the name to every Member seat they sit in. */
  rename: (userId: string, name: string) => Promise<void>
  /** How many Users exist; the demo seed reads it to stay inert beside real data. */
  count: () => Promise<number>
  /** Whether a User holds this email; the demo seed reads it to detect a half-run. */
  hasEmail: (email: string) => Promise<boolean>
}

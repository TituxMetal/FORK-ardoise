// Display formatting for the shared entry row: avatar initials and the French
// day label, mirroring the look captured from the Ardoise UX prototype (#76).

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
]

/** The first two characters of the first name, uppercased, for an avatar. */
export const initials = (name: string) => name.split(' ')[0]!.slice(0, 2).toUpperCase()

/** An ISO day ("2026-08-18") as a French day label ("18 août"). */
export const dayLabel = (iso: string) => {
  const [, month, day] = iso.split('-')
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`
}

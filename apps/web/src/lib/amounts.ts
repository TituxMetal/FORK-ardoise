export const euros = (cents: number) =>
  `${cents < 0 ? '−' : ''}${(Math.abs(cents) / 100).toFixed(2).replace('.', ',')} €`

export const centsFromEuros = (value: string) => Math.round(Number(value.replace(',', '.')) * 100)

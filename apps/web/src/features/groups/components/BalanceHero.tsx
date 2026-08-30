import { DownIcon, UpIcon } from '~/components/icons'
import type { Group } from '../types'
import { selfBalanceLabel } from '../utils'

type Props = {
  group: Group
}

export const BalanceHero = ({ group }: Props) => {
  const selfBalance =
    group.balances.find(balance => balance.userId === group.selfMemberId)?.amount ?? 0
  const positive = selfBalance >= 0

  return (
    <section aria-label="Votre solde" className="rounded-xl bg-accent p-4 text-on-accent">
      <p className="text-sm font-medium opacity-80">Ton solde</p>
      <p className="mt-0.5 flex items-center gap-2 text-2xl font-bold">
        {positive ? <UpIcon /> : <DownIcon />}
        {selfBalanceLabel(selfBalance)}
      </p>
    </section>
  )
}

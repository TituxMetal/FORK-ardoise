import { DownIcon, UpIcon } from '~/components/icons'
import { signedEuros } from '~/lib/amounts'
import type { Group } from '../types'

type Props = {
  group: Group
}

export const MemberChips = ({ group }: Props) => (
  <ul className="flex flex-wrap gap-2">
    {group.balances.map(balance => {
      const isSelf = balance.userId === group.selfMemberId
      const positive = balance.amount >= 0
      return (
        <li
          key={balance.userId}
          className={`flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-sm font-semibold ${
            positive ? 'text-positive' : 'text-negative'
          } ${isSelf ? '' : 'ring-1 ring-border'}`}
        >
          {positive ? <UpIcon className="h-4 w-4" /> : <DownIcon className="h-4 w-4" />}
          {balance.name} {signedEuros(balance.amount)}
          {isSelf ? <span className="sr-only"> c’est vous</span> : null}
        </li>
      )
    })}
  </ul>
)

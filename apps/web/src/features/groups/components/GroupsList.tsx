import { Link } from '~/lib/router'
import type { GroupSummary } from '~features/groups/api'

export const GroupsList = ({ groups }: { groups: GroupSummary[] }) => (
  <div className="space-y-2">
    <h2 className="text-lg font-medium">Mes Groupes</h2>
    <ul className="space-y-1">
      {groups.map(group => (
        <li key={group.id}>
          <Link
            to={`/groups/${group.id}`}
            className="inline-flex h-11 items-center rounded-lg bg-surface px-3 hover:bg-surface-2"
          >
            {group.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

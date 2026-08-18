import { Link } from '../../lib/router.tsx'
import type { GroupSummary } from './client.ts'

export const GroupsList = ({ groups }: { groups: GroupSummary[] }) => (
  <div className="space-y-2">
    <h2 className="text-lg font-medium">Mes Groupes</h2>
    <ul className="space-y-1">
      {groups.map(group => (
        <li key={group.id}>
          <Link to={`/groups/${group.id}`} className="inline-block rounded bg-zinc-800 px-3 py-2">
            {group.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

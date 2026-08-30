import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, Button } from '~ui'
import { BackIcon } from '~/components/icons'
import { ExpenseForm, Expenses } from '~features/expenses'
import type { ExpensesClient } from '~features/expenses'
import {
  $activeTab,
  BalanceHero,
  closeForm,
  $error,
  $formOpen,
  $group,
  clearGroup,
  groupsClient,
  loadGroup,
  MemberChips,
  refreshGroup,
  SlateTabs,
  type GroupsClient
} from '~features/groups'
import { PaybackForm, Paybacks } from '~features/paybacks'
import type { PaybacksClient } from '~features/paybacks'
import { ServiceForm, Services } from '~features/services'
import type { ServicesClient } from '~features/services'
import { Link } from '~/lib/router'

type Props = {
  id: string
  groups?: GroupsClient
  expenses?: ExpensesClient
  services?: ServicesClient
  paybacks?: PaybacksClient
  copy?: (text: string) => Promise<void>
}

export const GroupPage = ({
  id,
  groups = groupsClient,
  expenses,
  services,
  paybacks,
  copy = text => navigator.clipboard.writeText(text)
}: Props) => {
  const group = useStore($group)
  const error = useStore($error)
  const tab = useStore($activeTab)
  const formOpen = useStore($formOpen)

  useEffect(() => {
    void loadGroup(groups, id)
    return () => clearGroup()
  }, [groups, id])

  useEffect(() => {
    const onFocus = () => void refreshGroup(groups, id)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [groups, id])

  return (
    <section className="space-y-4">
      <Link
        to="/"
        className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-surface px-3 text-dim hover:bg-surface-2 hover:text-foreground"
      >
        <BackIcon />
        Retour aux Groupes
      </Link>
      {error ? <Alert message={error} /> : null}
      {group ? (
        <article className="space-y-4">
          <h2 className="text-lg font-medium">{group.name}</h2>
          <Button
            type="button"
            onClick={() => void copy(`${window.location.origin}/invites/${group.invite.secret}`)}
          >
            Copier le lien d’Invitation
          </Button>
          <BalanceHero group={group} />
          <MemberChips group={group} />
          <SlateTabs />
          <div
            role="tabpanel"
            id="slate-panel-expenses"
            aria-labelledby="slate-tab-expenses"
            className="space-y-4"
          >
            {tab === 'expenses' ? (
              <>
                {formOpen ? <ExpenseForm client={expenses} onCancel={closeForm} /> : null}
                <Expenses client={expenses} />
              </>
            ) : null}
          </div>
          <div
            role="tabpanel"
            id="slate-panel-services"
            aria-labelledby="slate-tab-services"
            className="space-y-4"
          >
            {tab === 'services' ? (
              <>
                {formOpen ? <ServiceForm client={services} onCancel={closeForm} /> : null}
                <Services client={services} />
              </>
            ) : null}
          </div>
          <div
            role="tabpanel"
            id="slate-panel-paybacks"
            aria-labelledby="slate-tab-paybacks"
            className="space-y-4"
          >
            {tab === 'paybacks' ? (
              <>
                {formOpen ? <PaybackForm client={paybacks} onCancel={closeForm} /> : null}
                <Paybacks client={paybacks} />
              </>
            ) : null}
          </div>
        </article>
      ) : error ? null : (
        <p>Chargement…</p>
      )}
    </section>
  )
}

import { PlusIcon } from '~/components/icons'

export type SlateTab = 'expenses' | 'services' | 'paybacks'

const TABS: { key: SlateTab; label: string }[] = [
  { key: 'expenses', label: 'Dépenses' },
  { key: 'services', label: 'Services' },
  { key: 'paybacks', label: 'Remboursements' }
]

const ADD_LABELS: Record<SlateTab, string> = {
  expenses: 'Ajouter une Dépense',
  services: 'Ajouter un Service',
  paybacks: 'Ajouter un Remboursement'
}

type Props = {
  active: SlateTab
  onChange: (tab: SlateTab) => void
  onAdd: () => void
}

export const SlateTabs = ({ active, onChange, onAdd }: Props) => (
  <div className="flex items-stretch gap-2">
    <div
      role="tablist"
      aria-label="Entrées"
      className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-lg bg-surface p-1"
    >
      {TABS.map(tab => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`h-11 shrink-0 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors ${
            active === tab.key ? 'bg-accent text-on-accent' : 'text-dim hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
    <button
      type="button"
      aria-label={ADD_LABELS[active]}
      onClick={onAdd}
      className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent hover:opacity-90"
    >
      <PlusIcon />
    </button>
  </div>
)

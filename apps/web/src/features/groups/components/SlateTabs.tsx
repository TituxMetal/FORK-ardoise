import { useRef, type KeyboardEvent, type Ref } from 'react'
import { useStore } from '@nanostores/react'
import { PlusIcon } from '~/components/icons'
import { $activeTab, openForm, setActiveTab } from '../store'
import type { SlateTab } from '../types'

const TABS: { key: SlateTab; label: string; tabId: string; panelId: string }[] = [
  {
    key: 'expenses',
    label: 'Dépenses',
    tabId: 'slate-tab-expenses',
    panelId: 'slate-panel-expenses'
  },
  {
    key: 'services',
    label: 'Services',
    tabId: 'slate-tab-services',
    panelId: 'slate-panel-services'
  },
  {
    key: 'paybacks',
    label: 'Règlements',
    tabId: 'slate-tab-paybacks',
    panelId: 'slate-panel-paybacks'
  }
]

const ADD_LABELS: Record<SlateTab, string> = {
  expenses: 'Ajouter une Dépense',
  services: 'Ajouter un Service',
  paybacks: 'Ajouter un Règlement'
}

export const SlateTabs = ({ ref }: { ref?: Ref<HTMLButtonElement> }) => {
  const active = useStore($activeTab)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex(tab => tab.key === active)
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    if (next === null) return
    event.preventDefault()
    setActiveTab(TABS[next].key)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="flex items-stretch gap-2">
      <div
        role="tablist"
        aria-label="Entrées"
        onKeyDown={onKeyDown}
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-lg bg-surface p-1"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.key}
            ref={node => {
              tabRefs.current[index] = node
            }}
            type="button"
            role="tab"
            id={tab.tabId}
            aria-selected={active === tab.key}
            aria-controls={tab.panelId}
            tabIndex={active === tab.key ? 0 : -1}
            onClick={() => setActiveTab(tab.key)}
            className={`h-11 shrink-0 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors ${
              active === tab.key ? 'bg-accent text-on-accent' : 'text-dim hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button
        ref={ref}
        type="button"
        aria-label={ADD_LABELS[active]}
        onClick={openForm}
        className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent hover:opacity-90"
      >
        <PlusIcon />
      </button>
    </div>
  )
}

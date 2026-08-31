import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

const tabs = [
  { id: 'sign-up', label: 'Inscription' },
  { id: 'sign-in', label: 'Connexion' }
] as const

export type AuthTab = (typeof tabs)[number]['id']

export const SessionForms = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('sign-up')
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const panelIds: Record<AuthTab, string> = {
    'sign-up': `${baseId}-panel-sign-up`,
    'sign-in': `${baseId}-panel-sign-in`
  }
  const tabIds: Record<AuthTab, string> = {
    'sign-up': `${baseId}-tab-sign-up`,
    'sign-in': `${baseId}-tab-sign-in`
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex(tab => tab.id === activeTab)
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    const target = (next + tabs.length) % tabs.length
    setActiveTab(tabs[target].id)
    tabRefs.current[target]?.focus()
  }

  return (
    <section className="mx-auto w-full max-w-sm" aria-label="Authentification">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div
          role="tablist"
          aria-label="Choisir le formulaire"
          onKeyDown={onKeyDown}
          className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={node => {
                tabRefs.current[index] = node
              }}
              type="button"
              role="tab"
              id={tabIds[tab.id]}
              aria-selected={activeTab === tab.id}
              aria-controls={panelIds[tab.id]}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`h-11 rounded-md px-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-on-accent'
                  : 'text-dim hover:bg-surface hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={panelIds['sign-up']}
          aria-labelledby={tabIds['sign-up']}
          hidden={activeTab !== 'sign-up'}
        >
          <SignUpForm />
        </div>
        <div
          role="tabpanel"
          id={panelIds['sign-in']}
          aria-labelledby={tabIds['sign-in']}
          hidden={activeTab !== 'sign-in'}
        >
          <SignInForm />
        </div>
      </div>
    </section>
  )
}

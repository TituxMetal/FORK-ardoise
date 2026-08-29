/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import type { GroupSummary } from '~features/groups/api/groups.client'
import { GroupsList } from '~features/groups/GroupsList'

afterEach(cleanup)

const groups: GroupSummary[] = [
  { id: 'g1', name: 'Potes de Bob' },
  { id: 'g2', name: 'Collègues' }
]

describe('GroupsList', () => {
  it('renders each Group as a Link to its page', () => {
    render(<GroupsList groups={groups} />)

    const links = screen.getAllByRole('link')
    expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Potes de Bob', '/groups/g1'],
      ['Collègues', '/groups/g2']
    ])
  })
})

/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { Link, parsePath } from '~/lib/router'

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

const clickLink = (name: string) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
  screen.getByRole('link', { name }).dispatchEvent(event)
  return event
}

// happy-dom resolves a target=_blank click by opening a page and loading the
// href; intercept that fetch so it never reaches the network in tests.
const stubPageOpenFetches = () => {
  ;(
    window as unknown as {
      happyDOM: {
        settings: {
          fetch: { interceptor: { beforeAsyncRequest: () => Promise<Response | void> } }
        }
      }
    }
  ).happyDOM.settings.fetch.interceptor = {
    beforeAsyncRequest: async () => new Response('', { status: 404 })
  }
}

describe('parsePath', () => {
  it('parses the groups list route', () => {
    expect(parsePath('/')).toEqual({ name: 'groups' })
  })

  it('parses a group detail route', () => {
    expect(parsePath('/groups/g1')).toEqual({ name: 'group', id: 'g1' })
  })

  it('parses an invite route', () => {
    expect(parsePath('/invites/abc-123')).toEqual({ name: 'invite', secret: 'abc-123' })
  })

  it('parses the auth route', () => {
    expect(parsePath('/session')).toEqual({ name: 'auth' })
  })

  it('falls back to the groups list for unknown paths', () => {
    expect(parsePath('/unknown')).toEqual({ name: 'groups' })
  })
})

describe('Link', () => {
  it('navigates to `to` on a plain left click', () => {
    render(<Link to="/groups/g1">Groupe</Link>)
    const event = clickLink('Groupe')
    expect(event.defaultPrevented).toBe(true)
    expect(window.location.pathname).toBe('/groups/g1')
  })

  it('lets a target=_blank link behave like a normal link', () => {
    stubPageOpenFetches()
    render(
      <Link to="/groups/g1" target="_blank">
        Groupe
      </Link>
    )
    const event = clickLink('Groupe')
    expect(event.defaultPrevented).toBe(false)
  })

  it('lets a download link behave like a normal link', () => {
    render(
      <Link to="/groups/g1" download>
        Groupe
      </Link>
    )
    const event = clickLink('Groupe')
    expect(event.defaultPrevented).toBe(false)
  })
})

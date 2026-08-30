/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { Link, app, useRoute } from '~/lib/router'

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
  // happyDOM is a happy-dom runtime extra, absent from the DOM types.
  const happyDom = window as unknown as {
    happyDOM: {
      settings: {
        fetch: { interceptor: { beforeAsyncRequest: () => Promise<Response | void> } }
      }
    }
  }
  happyDom.happyDOM.settings.fetch.interceptor = {
    beforeAsyncRequest: async () => new Response('', { status: 404 })
  }
}

describe('router', () => {
  it('routes the groups list path', async () => {
    const response = await app.fetch(new Request('/'))

    expect(await response.json()).toEqual({ name: 'groups' })
  })

  it('routes a group detail path', async () => {
    const response = await app.fetch(new Request('/groups/g1'))

    expect(await response.json()).toEqual({ name: 'group', id: 'g1' })
  })

  it('routes an invite path', async () => {
    const response = await app.fetch(new Request('/invites/abc-123'))

    expect(await response.json()).toEqual({ name: 'invite', secret: 'abc-123' })
  })

  it('routes the profile path', async () => {
    const response = await app.fetch(new Request('/profile'))

    expect(await response.json()).toEqual({ name: 'profile' })
  })

  it('routes the auth path', async () => {
    const response = await app.fetch(new Request('/session'))

    expect(await response.json()).toEqual({ name: 'auth' })
  })

  it('falls back to the groups list for unknown paths', async () => {
    const response = await app.fetch(new Request('/unknown'))

    expect(await response.json()).toEqual({ name: 'groups' })
  })
})

describe('useRoute', () => {
  const Probe = () => {
    const route = useRoute()
    return <p>{route ? route.name : 'pending'}</p>
  }

  it('renders the pending state until the first resolution', () => {
    render(<Probe />)

    expect(screen.getByText('pending')).toBeTruthy()
  })

  it('resolves the current pathname through the app', async () => {
    render(<Probe />)

    expect(await screen.findByText('groups')).toBeTruthy()
  })

  it('re-resolves on history navigation', async () => {
    render(<Probe />)
    await screen.findByText('groups')

    window.history.pushState(null, '', '/groups/g1')
    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(await screen.findByText('group')).toBeTruthy()
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

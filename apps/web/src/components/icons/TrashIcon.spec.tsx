/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { TrashIcon } from './TrashIcon'

afterEach(cleanup)

describe('TrashIcon', () => {
  it('renders a decorative trash icon hidden from assistive technology', () => {
    const { container } = render(<TrashIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})

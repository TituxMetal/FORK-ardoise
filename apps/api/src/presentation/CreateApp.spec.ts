import { expect, test } from 'vite-plus/test'
import { createApp } from './CreateApp.ts'

test('ping responds 200', async () => {
  const app = createApp()
  const response = await app.request('/ping')
  expect(response.status).toBe(200)
})

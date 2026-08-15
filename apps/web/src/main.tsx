import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthScreen } from './presentation/AuthScreen.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Ardoise</h1>
      <AuthScreen />
    </main>
  </StrictMode>
)

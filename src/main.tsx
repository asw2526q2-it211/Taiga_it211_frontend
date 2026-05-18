import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* ─── Tema: carreguem els CSS de temes abans que els estils globals ─── */
import './styles/themes/light.css'
import './styles/themes/dark.css'
import './index.css'
import App from './App'
import { initTheme } from './styles/theme'

// Inicialitzar el tema desat (data-theme a <html>)
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

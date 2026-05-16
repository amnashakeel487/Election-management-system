import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n/config'
import App from './App'
import './styles/index.css'
import './styles/language-switcher.css'
import './styles/rtl.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tailwind.css'
import './index.css'
import './styles/professional-ui.css'
import './i18n'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { normalizeLocalDevOrigin } from './config/urls'

normalizeLocalDevOrigin()

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)

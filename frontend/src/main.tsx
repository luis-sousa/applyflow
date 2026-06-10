if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'function') {
  const CustomEventPolyfill = function(event: string, params: CustomEventInit = { bubbles: false, cancelable: false, detail: null }) {
    const evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles ?? false, params.cancelable ?? false, params.detail)
    return evt
  }

  CustomEventPolyfill.prototype = Event.prototype
  window.CustomEvent = CustomEventPolyfill as unknown as typeof CustomEvent
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

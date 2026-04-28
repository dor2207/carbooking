import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { BookingsProvider } from './contexts/BookingsContext'
import './index.css'

// Lock to portrait when the browser API is available (works for installed PWA)
if (screen.orientation && (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock) {
  (screen.orientation as ScreenOrientation & { lock: (o: string) => Promise<void> })
    .lock('portrait').catch(() => { /* browser may block without fullscreen */ })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BookingsProvider>
        <App />
      </BookingsProvider>
    </AuthProvider>
  </React.StrictMode>
)

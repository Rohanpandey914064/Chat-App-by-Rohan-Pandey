import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/react'
import { BrowserRouter } from "react-router";
import { setChatStoreRef } from './store/useAuthStore.js'
import { useChatStore } from './store/useChatStore.js'

// Wire the chat store reference into the auth store
// This avoids circular ESM imports while still allowing socket events
// in useAuthStore to call useChatStore actions.
setChatStoreRef(useChatStore.getState);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

const shadowRootElement = document.createElement('div')
const shadowRoot = shadowRootElement.attachShadow({ mode: 'open' })
document.body.appendChild(shadowRootElement)

const rootElement = document.createElement('div')
rootElement.id = 'extension-app-root'
shadowRoot.appendChild(rootElement)

// Create an Emotion cache scoped to the Shadow DOM
const emotionCache = createCache({
  key: 'extension-app',
  prepend: true,
  container: rootElement,
  speedy: true,
});

const reactRoot = createRoot(rootElement)
reactRoot.render(
  <StrictMode>
    <CacheProvider value={emotionCache}>
      <App />
    </CacheProvider>
  </StrictMode>
)

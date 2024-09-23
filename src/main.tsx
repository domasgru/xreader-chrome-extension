import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

let appRoot: HTMLElement | null = null;
let reactRoot: ReturnType<typeof createRoot> | null = null;

function injectApp() {
  if (appRoot) return;

  const shadowRootElement = document.createElement('div')
  shadowRootElement.id = 'ai-reader-root'
  const shadowRoot = shadowRootElement.attachShadow({ mode: 'open' })
  document.body.appendChild(shadowRootElement)

  appRoot = document.createElement('div')
  appRoot.id = 'extension-app-root'
  shadowRoot.appendChild(appRoot)

  const emotionCache = createCache({
    key: 'extension-app',
    prepend: true,
    container: appRoot,
    speedy: true,
  });

  reactRoot = createRoot(appRoot)
  reactRoot.render(
    <StrictMode>
      <CacheProvider value={emotionCache}>
        <App />
      </CacheProvider>
    </StrictMode>
  )
}

function removeApp() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  if (appRoot) {
    appRoot.remove();
    appRoot = null;
  }
}

function toggleApp() {
  if (appRoot) {
    removeApp();
  } else {
    injectApp();
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleApp") {
    toggleApp();
  }
});

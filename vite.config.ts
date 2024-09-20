import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // TODO: consider using other plugin
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig(({}) => ({
  plugins: [
    react({jsxImportSource: "@emotion/react"}), 
    crx({ manifest })
  ],
}))

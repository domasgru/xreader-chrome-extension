import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // TODO: consider using other plugin
import { crx } from '@crxjs/vite-plugin'
import manifestJson from './manifest.json'
import svgr from "vite-plugin-svgr";

const manifestRewrites = process.env.NODE_ENV === 'production' ? {
  name: 'XReader',
  icons: {
    16: 'icon-w-16.png',
    32: 'icon-w-32.png',
    48: 'icon-b-128.png',
    128: 'icon-w-128.png'
  }
} : {
  name: 'XReader(DEV)',
  icons: {
    16: 'icon-b-16.png',
    32: 'icon-b-32.png',
    48: 'icon-b-128.png',
    128: 'icon-b-128.png'
  }
}

const manifest = {
  ...manifestJson,
  ...manifestRewrites,
}

// https://vitejs.dev/config/
export default defineConfig(({ }) => ({
  plugins: [
    react({ jsxImportSource: "@emotion/react" }),
    svgr(),
    crx({
      manifest,
    })
  ],
}))

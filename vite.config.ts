import { defineConfig } from 'vite'

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:4173/yamisoko/'

export default defineConfig({
  base: '/yamisoko/',
  plugins: [
    {
      name: 'site-url',
      transformIndexHtml: { order: 'pre', handler: html => html.replaceAll('%SITE_URL%', SITE_URL) },
    },
  ],
})

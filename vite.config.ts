import { defineConfig } from 'vite'
import { resolve } from 'path'
import prerender from '@prerenderer/rollup-plugin'
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer'

export default defineConfig({
  build: {
    target: 'es2020'
  },
  plugins: [
    prerender({
      routes: ['/'],
      renderer: new PuppeteerRenderer({
        headless: true,
        renderAfterTime: 500
      }),
      postProcess(renderedRoute) {
        renderedRoute.html = renderedRoute.html
          .replace(/http:\/\/localhost:\d+/g, 'https://dandhi.dev')
      }
    })
  ]
})

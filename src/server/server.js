import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })

  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const url = req.originalUrl

    try {
      // Read index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, '../../index.html'),
        'utf-8'
      )

      // Apply Vite HTML transforms
      template = await vite.transformIndexHtml(url, template)

      // Load server entry
      const { render } = await vite.ssrLoadModule('/src/server/entry-server.tsx')

      // Render app HTML
      const { html: appHtml } = await render(url)

      // Inject app HTML into template
      const html = template.replace(`<div id="root"></div>`, `<div id="root">${appHtml}</div>`)

      // Send rendered HTML
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })

  // Start your existing backend server
  const backendPort = 3001 // Make sure this matches your backend port
  const frontendPort = 5173 // Default Vite port

  app.listen(frontendPort, () => {
    console.log(`SSR server started at http://localhost:${frontendPort}`)
  })
}

createServer()
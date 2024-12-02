import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import ServerApp from './ServerApp'

export function render(url: string) {
  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <ServerApp />
      </StaticRouter>
    </React.StrictMode>
  )
  return { html }
}

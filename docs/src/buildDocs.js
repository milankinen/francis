import * as fs from "fs"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { UI, setupInteractions } from "./ui"

const api = require("../api.json")
const version = require("../../package.json").version

const intro = fs.readFileSync("./INTRODUCTION.md").toString()

const setupInteractionsOnPageLoad = () =>
  `document.addEventListener("DOMContentLoaded", ${setupInteractions.toString()});`

const script = code => <script type="text/javascript" dangerouslySetInnerHTML={{ __html: code }} />

const APIDocs = () => (
  <html>
    <head>
      <title>Francis API docs</title>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/siimple@3.2.0/dist/siimple.min.css"
      />
      <link
        rel="stylesheet"
        href="https://use.fontawesome.com/releases/v5.6.3/css/all.css"
        integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href="./app.css" />
    </head>
    <body>
      <UI version={version} api={api} intro={intro} />
      {script(setupInteractionsOnPageLoad())}
    </body>
  </html>
)

fs.writeFileSync("index.html", renderToStaticMarkup(<APIDocs />))

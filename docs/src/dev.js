import React from "react"
import { render } from "react-dom"
import { UI, setupInteractions } from "./ui"

const api = require("../api.json")

class DevUI extends React.Component {
  componentDidMount() {
    setupInteractions()
  }
  render() {
    return <UI api={api} version="DEV" />
  }
}

render(<DevUI />, document.getElementById("dev-app"))

import React from "react"
import { render } from "react-dom"
import { UI, setupInteractions } from "./ui"

const api = require("../api.json")
const intro = fetch(require("../INTRODUCTION.md")).then(x => x.text())

class DevUI extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  componentDidMount() {
    intro.then(i => this.setState({ intro: i }))
    setTimeout(setupInteractions, 0)
  }
  render() {
    const { intro } = this.state
    return intro ? <UI api={api} intro={intro} version="DEV" /> : null
  }
}

render(<DevUI />, document.getElementById("dev-app"))

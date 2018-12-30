import * as _ from "lodash"
import React from "react"
import Markdown from "react-markdown/with-html"
import SyntaxHighlighter, { registerLanguage } from "react-syntax-highlighter/dist/prism-light"
import tsLang from "react-syntax-highlighter/dist/languages/prism/typescript"
import baseCodeStyle from "react-syntax-highlighter/dist/styles/prism/base16-ateliersulphurpool.light"

registerLanguage("ts", tsLang)

const codeStyle = _.extend(
  _.transform(baseCodeStyle, (res, value, key) =>
    _.extend(res, { [key]: _.omit(value, "background") }),
  ),
  {
    'pre[class*="language-"]': {
      padding: "15px",
      borderRadius: "5px",
      background: "#eef2f7",
      fontSize: "13px",
      overflowX: "auto",
    },
  },
)
codeStyle['code[class*="language-"]'].fontSize = "13px"

const CodeBlock = ({ code, language = "ts" }) => (
  <SyntaxHighlighter language={language} style={codeStyle}>
    {code}
  </SyntaxHighlighter>
)

const InlineCode = ({ children }) => <code className="siimple-code">{children}</code>

const Md = ({ value }) => (
  <Markdown
    source={value}
    escapeHtml={false}
    renderers={{
      code: ({ children }) => <CodeBlock code={children} />,
      inlineCode: ({ children }) => <InlineCode>{children}</InlineCode>,
    }}
  />
)

const Navbar = ({ version }) => (
  <div id="-top-navi" className="siimple-navbar siimple-navbar--dark siimple-navbar--fluid">
    <button id="sidebar-toggle" className="siimple-btn siimple-btn--navy">
      <i className="fas fa-bars" />
    </button>
    <a className="siimple-navbar-title" href=".">
      Francis
    </a>
    <span className="siimple-navbar-subtitle">{version}</span>
    <div className="siimple--float-right">
      <a
        id="github-btn"
        className="siimple-navbar-item"
        href="https://github.com/milankinen/francis"
      >
        <i className="fab fa-github fa-lg" />
      </a>
    </div>
  </div>
)

const SidebarLink = ({ href, title }) => (
  <a href={`#${href}`} className="link siimple-small siimple--text-bold">
    {title}
  </a>
)

const SearchableGroup = ({ title, items }) => (
  <article className="searchable">
    <h4>{title}</h4>
    {items}
    <span
      className="no-matches siimple-small siimple--text-bold"
      style={{ color: "#546778", display: "none" }}
    >
      No matches
    </span>
  </article>
)

const Sidebar = ({ functions }) => (
  <section id="-side-navi" className="siimple--bg-light">
    <input id="-search" type="text" className="siimple-input" placeholder="Search..." />
    {/* <SearchableGroup title="Classes" items={[]} /> */}
    <SearchableGroup
      title="Functions"
      items={_.chain(functions)
        .map(({ name }, i) => <SidebarLink key={i} href={name.toLowerCase()} title={name} />)
        .value()}
    />
    {/* <SearchableGroup title="Interfaces" items={[]} /> */}
  </section>
)

const FunctionDoc = ({ name, description, signatures, params, returns, seeAlso, example }) => (
  <div className="doc siimple-card" id={name.toLowerCase()}>
    <div className="siimple-card-body">
      <div className="siimple-card-title">{name}</div>
      <CodeBlock code={signatures.join("\n")} />
      <Md value={description} />
      <h4>Params</h4>
      {_.keys(params).length > 0 ? (
        <table className="params">
          <tbody>
            {_.chain(params)
              .values()
              .sortBy(p => p.index)
              .map(({ name, description }, i) => (
                <tr key={i} className="siimple-small">
                  <td className="name siimple--text-bold">{name}</td>
                  <td>
                    <Md value={description} />
                  </td>
                </tr>
              ))
              .value()}
          </tbody>
        </table>
      ) : (
        "None"
      )}
      <h4>
        Returns <InlineCode>{returns.type}</InlineCode>
      </h4>
      <div className="returns siimple-small">
        {returns.description ? <Md value={returns.description} /> : null}
      </div>
      {seeAlso.length ? <h4>See also</h4> : null}
      {seeAlso.map((name, i) => (
        <a key={i} href={`#${name.toLowerCase()}`} className="siimple-small">
          {name}
        </a>
      ))}
      {example ? <h4>Example</h4> : null}
      {example ? <CodeBlock code={example} /> : null}
    </div>
  </div>
)

const Main = ({ functions }) => (
  <section id="-main">
    {functions.map((f, i) => (
      <FunctionDoc key={i} {...f} />
    ))}
  </section>
)

export const UI = ({ version, api: { functions } }) => {
  const sortedFunctions = _.chain(functions)
    .sortBy(f => f.name)
    .value()
  return (
    <div id="-app" className="navi-open">
      <Navbar version={version} />
      <div id="-content">
        <Main functions={sortedFunctions} />
        <Sidebar functions={sortedFunctions} />
      </div>
    </div>
  )
}

/**
 * We want to have real static html site without extra JS libraries so we're gonna
 * do the interactions (toggle and search) by using vanilla JS and inject this script
 * to the rendered page source.
 */
export function setupInteractions() {
  var app = document.getElementById("-app")
  var toggle = document.getElementById("sidebar-toggle")
  var search = document.getElementById("-search")
  toggle.addEventListener("click", function() {
    if (app.classList.contains("navi-open")) {
      app.classList.remove("navi-open")
    } else {
      app.classList.add("navi-open")
    }
  })
  search.addEventListener("focus", function() {
    search.setSelectionRange(0, search.value.length)
  })
  search.addEventListener("input", function(event) {
    var query = (event.target.value || "").trim().toLowerCase()
    document.querySelectorAll("#-side-navi article.searchable").forEach(function(group) {
      var hasMatches = false
      group.querySelectorAll(".link").forEach(function(link) {
        if (query.length === 0 || link.textContent.toLowerCase().indexOf(query) !== -1) {
          link.style.display = "block"
          hasMatches = true
        } else {
          link.style.display = "none"
        }
      })
      var noMatch = group.querySelector(".no-matches")
      noMatch.style.display = hasMatches ? "none" : "block"
    })
  })
}

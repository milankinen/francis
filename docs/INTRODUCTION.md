<div id="installation"></div>

## Installation

#### NPM

```bash
npm i --save francis
```

#### Yarn

```bash
yarn add francis
```

#### CDN

```ts
<script type="text/javascript" src="https://unpkg.com/francis@{{{VERSION}}}/dist/francis.min.js"></script>
```

<div id="usage"></div>

## Usage

Francis can be used by using either ES6 module syntax or normal CommonJS module syntax.
Note that `francis` package is 100% tree shakeable so if you're using ES6 module syntax,
modern bundlers with UglifyJS (such as Webpack) include only the used functions to your
application!

```ts
// ES6 wildcard
import * as F from "francis"

// ES6 named imports
import {map, combineAsArray} from "francis"

// CommonJS
const F = require("francis")
const {map, combineAsArray} = require("francis")
```

Every operator in Francis is [curried](https://en.wikipedia.org/wiki/Currying). Francis
offers a built-in convenience function called `pipe` that allows to "chain"
different operators in a type-safe manner:

```ts
import * as F from "francis"

F.pipe(
  F.interval(1000, "!"),
  F.scan("Francis", (s, x) => s + x),
  F.map(s => "Hello " + s.toUpperCase()),
  F.skip(2),
  F.take(2),
  F.onValue(console.log),
)
```

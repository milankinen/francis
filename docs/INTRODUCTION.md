<div id="installation"></div>

## Installation

#### NPM

```bash
npm install francis
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
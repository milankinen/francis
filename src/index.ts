
const __DEV__ = process.env.NODE_ENV != "production"

export interface Stream {
  __type: "stream"
}

export interface Property {
  __type: "property"
}


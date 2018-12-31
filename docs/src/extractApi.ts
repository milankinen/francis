import * as fs from "fs"
import * as _ from "lodash"
import { Application, DeclarationReflection, ReflectionKind, SignatureReflection } from "typedoc"
import { Comment, ReferenceType, ReflectionType, Type } from "typedoc/dist/lib/models"

const docs = new Application({ target: "es6", mode: "modules" })
const result = docs.convert(["../src/index.ts"])

interface FrancisParam {
  name: string
  index: number
  description?: string
  from: "signature" | "comment"
}

interface FrancisReturn {
  type: string
  description?: string
}

type FrancisParams = Record<string, FrancisParam>

interface FrancisFunction {
  name: string
  description: string
  signatures: string[]
  params: FrancisParams
  seeAlso: string[]
  category?: string
  returns: FrancisReturn
  example?: string
}

const signatureParams = (sig: SignatureReflection): FrancisParams =>
  ((sig && sig.parameters) || [])
    .map((p, idx) => {
      const comment = p.comment
      return {
        name: p.name,
        index: idx,
        description: comment ? comment.text || comment.shortText : undefined,
        from: "signature",
      }
    })
    .reduce((all, p) => ({ ...all, [p.name]: p }), {})

const commentParams = (comment: Comment): FrancisParams =>
  ((comment && comment.tags) || [])
    .filter(tag => tag.tagName === "param")
    .map((tag, idx) => ({
      name: tag.paramName,
      index: idx,
      description: tag.text,
      from: "comment",
    }))
    .reduce((all, p) => ({ ...all, [p.name]: p }), {})

const selectParam = (p1: FrancisParam, p2: FrancisParam): FrancisParam => {
  const order = (p: FrancisParam) => (p.from === "signature" ? -1000000 : 0) + p.index
  return [p1, p2].sort((a, b) => order(a) - order(b))[0]
}
const combineParams = (...params: FrancisParams[]): FrancisParams =>
  _.chain(params)
    .flatMap(p => _.values(p))
    .reduce((all: FrancisParams, p: FrancisParam) => {
      const prev = p.name in all ? all[p.name] : p
      const next = { ...selectParam(p, prev), description: prev.description || p.description }
      return {
        ...all,
        [p.name]: next,
      }
    }, {})
    .value()

const publicDeclarationsOf = (kind: ReflectionKind) =>
  (result.getReflectionsByKind(kind) as DeclarationReflection[]).filter(
    r => r.flags.isExported && r.flags.isPublic,
  )

const callSignatures = (type: Type): SignatureReflection[] => {
  if (type.type === "reference") {
    const refType = type as ReferenceType
    if (!refType.reflection) {
      return []
    }
    const kind = refType.reflection.kind
    if (kind === ReflectionKind.Interface || kind === ReflectionKind.TypeLiteral) {
      return ((type as ReferenceType).reflection as DeclarationReflection)
        .getAllSignatures()
        .filter(sig => sig.name === "__call")
    }
  } else if (type.type === "reflection") {
    return (type as ReflectionType).declaration
      .getAllSignatures()
      .filter(sig => sig.name === "__call")
  }
  return []
}

const typeToString = (type: Type): string => {
  const curriedCalls = callSignatures(type)
  return curriedCalls.length > 0 ? signatureToString(curriedCalls[0]) : type.toString()
}

const signatureToString = (sig: SignatureReflection): string => {
  const params = (sig.parameters || []).map(p => `${p.name}: ${p.type.toString()}`).join(", ")
  return `(${params}) => ${typeToString(sig.type)}`
}

const firstComment = (sigs: SignatureReflection[]): Comment | undefined =>
  sigs.filter(s => s.comment).map(s => s.comment)[0]

const extractTags = (comment: Comment | undefined, tag: string): string[] =>
  (comment ? comment.tags : [])
    .filter(t => t.tagName === tag && t.text.trim())
    .map(t => t.text.trim())

const functions: FrancisFunction[] = publicDeclarationsOf(ReflectionKind.Function).map(
  reflection => {
    const sigs = reflection
      .getAllSignatures()
      .sort((a, b) => (a.parameters || []).length - (b.parameters || []).length)
      .reverse()
    const comment = reflection.comment || firstComment(sigs)
    return {
      name: reflection.name,
      description: comment ? comment.text || comment.shortText : "",
      signatures: sigs.map(signatureToString),
      params: combineParams(commentParams(reflection.comment), ...sigs.map(signatureParams)),
      category: extractTags(comment, "category")[0],
      seeAlso: extractTags(comment, "see"),
      returns: {
        type: typeToString(sigs[0].type),
        description: extractTags(comment, "returns")[0],
      },
      example: extractTags(comment, "example")[0],
    }
  },
)

const curriedFunctions: FrancisFunction[] = publicDeclarationsOf(ReflectionKind.Variable)
  .filter(reflection => callSignatures(reflection.type).length > 0)
  .map(reflection => {
    const sigs = callSignatures(reflection.type)
      .sort((a, b) => (a.parameters || []).length - (b.parameters || []).length)
      .reverse()
    const comment = reflection.comment || firstComment(sigs)
    return {
      name: reflection.name,
      description: comment ? comment.shortText : "",
      signatures: sigs.map(signatureToString),
      params: combineParams(commentParams(reflection.comment), ...sigs.map(signatureParams)),
      category: extractTags(comment, "category")[0],
      seeAlso: extractTags(comment, "see"),
      returns: {
        type: typeToString(sigs[0].type),
        description: extractTags(comment, "returns")[0],
      },
      example: extractTags(comment, "example")[0],
    }
  })

const data = {
  functions: [...functions, ...curriedFunctions],
}

fs.writeFileSync("api.json", JSON.stringify(data, null, 2))

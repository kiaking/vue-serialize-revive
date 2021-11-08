import { isArray, isObject, isFunction } from '@vue/shared'
import { Ref, ComputedRef, isRef } from '@vue/reactivity'

export type SerializedEntry =
  | SerializedRoot
  | SerializedValue
  | SerializedArray
  | SerializedObject
  | SerializedMap
  | SerializedRef
  | SerializedKeep

export type SerializedRoot = ['_', Record<string, number>]
export type SerializedValue = ['v', any]
export type SerializedArray = ['a', number[], SerializedPaths]
export type SerializedObject = ['o', Record<string, number>, SerializedPaths]
export type SerializedMap = ['m', [any, number][], SerializedPaths]
export type SerializedRef = ['r', number, SerializedPaths]
export type SerializedKeep = ['k', SerializedPaths]

export type SerializedPaths = SerializedPath[]
export type SerializedPath = (string | number | SerializedPath)[]

export function serialize(data: Record<string, any>): SerializedEntry[] {
  const entries = [] as SerializedEntry[]

  encode(data, entries, new Map())

  entries[0] = ['_', entries[0][1]]

  return entries
}

function encode(
  data: unknown,
  entries: SerializedEntry[],
  seen: Map<any, number>,
  path?: SerializedPath
): number {
  const seenIndex = seen.get(data)

  if (seenIndex !== undefined) {
    const esitstingPath = entries[seenIndex][2]

    esitstingPath && path && esitstingPath.push(path)

    return seenIndex
  }

  const index = entries.length

  if (isFunction(data)) {
    encodeKeep(entries, path)
  } else if (isComputed(data)) {
    encodeKeep(entries, path)
  } else if (isRef(data)) {
    encodeRef(data, index, entries, seen, path)
  } else if (isArray(data)) {
    encodeArray(data, index, entries, seen, path)
  } else if (isObject(data)) {
    encodeObject(data, index, entries, seen, path)
  } else {
    entries.push(['v', data])
  }

  return index
}

function encodeArray(
  data: any[],
  index: number,
  entries: SerializedEntry[],
  seen: Map<any, number>,
  path: SerializedPath = []
): void {
  seen.set(data, index)

  const stored = [] as any[]
  const paths = [path]

  entries.push(['a', stored, paths])

  data.forEach((value, index) => {
    stored[index] = encode(value, entries, seen, [...path, [index]])
  })
}

function encodeObject(
  data: Record<string, any>,
  index: number,
  entries: SerializedEntry[],
  seen: Map<any, number>,
  path: SerializedPath = []
): void {
  seen.set(data, index)

  const stored = {} as Record<string, number>
  const paths = [path]

  entries.push(['o', stored, paths])

  for (const key in data) {
    const value = data[key]
    const path = [key]

    paths.push(path)

    stored[key] = encode(value, entries, seen, path)
  }
}

function encodeRef(
  data: Ref,
  index: number,
  entries: SerializedEntry[],
  seen: Map<any, number>,
  path: SerializedPath = []
): void {
  seen.set(data, index)

  const paths = [path]

  const size = entries.push(['r', 0, paths])

  entries[size - 1][1] = encode(data.value, entries, seen, path)
}

function encodeKeep(
  entries: SerializedEntry[],
  path: SerializedPath = []
): void {
  entries.push(['k', [path]])
}

function isComputed(value: unknown): value is ComputedRef {
  return isRef(value) && (value as any).effect
}

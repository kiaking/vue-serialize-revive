import { isArray, isObject } from '@vue/shared'
import { Ref, isRef, ref } from '@vue/reactivity'
import {
  SerializedEntry,
  SerializedRoot,
  SerializedArray,
  SerializedObject,
  // SerializedMap,
  SerializedRef,
  SerializedKeep,
  SerializedPaths,
  SerializedPath
} from './serialize'

type Base = Record<string, any>

export function revive(base: Base, entries: SerializedEntry[]): void {
  const root = clone(entries)[0] as SerializedRoot

  for (const key in root[1]) {
    const pointer = root[1][key]
    const entry = entries[pointer]

    root[1][key] = reviveEntry(base, entry, entries, pointer)
  }

  for (const key in root[1]) {
    base[key] = root[1][key]
  }

  for (const key in base) {
    if (root[1][key] === undefined) {
      delete base[key]
    }
  }
}

function reviveEntry(
  base: Base,
  entry: SerializedEntry,
  entries: SerializedEntry[],
  pointer: number
): any {
  if (entry[0] === 'v') {
    return entry[1]
  } else if (entry[0] === 'a') {
    return reviveArray(base, entry, entries, pointer)
  } else if (entry[0] === 'o') {
    return reviveObject(base, entry, entries, pointer)
  } else if (entry[0] === 'r') {
    return reviveRef(base, entry, entries, pointer)
  } else if (entry[0] === 'k') {
    return reviveKeep(base, entry, entries, pointer)
  }
}

function reviveArray(
  base: Base,
  entry: SerializedArray,
  entries: SerializedEntry[],
  pointer: number
): any[] {
  const value = find<any[]>(base, entry[2], isArray) ?? ([] as any[])

  entries[pointer] = ['v', value]

  entry[1].forEach((nextPointer, index) => {
    const nextEntry = entries[nextPointer]

    value[index] = reviveEntry(base, nextEntry, entries, nextPointer)
  })

  const valueLength = value.length
  const entryLength = entry[1].length
  const diff = valueLength - entryLength

  if (diff > 0) {
    value.splice(entryLength, diff)
  }

  return value
}

function reviveObject(
  base: Base,
  entry: SerializedObject,
  entries: SerializedEntry[],
  pointer: number
): Record<string, any> {
  const value =
    find<Record<string, any>>(base, entry[2], isObject) ??
    ({} as Record<string, any>)

  entries[pointer] = ['v', value]

  for (const key in entry[1]) {
    const nextPointer = entry[1][key]
    const nextEntry = entries[nextPointer]

    value[key] = reviveEntry(base, nextEntry, entries, nextPointer)
  }

  return value
}

function reviveRef(
  base: Base,
  entry: SerializedRef,
  entries: SerializedEntry[],
  pointer: number
): Ref {
  const value = find<Ref>(base, entry[2], isRef) ?? ref()

  entries[pointer] = ['v', value]

  const nextPointer = entry[1]
  const nextEntry = entries[nextPointer]

  value.value = reviveEntry(base, nextEntry, entries, nextPointer)

  return value
}

function reviveKeep(
  base: Base,
  entry: SerializedKeep,
  entries: SerializedEntry[],
  pointer: number
): void {
  const value = find<any>(base, entry[1], v => v !== undefined)

  entries[pointer] = ['v', value]

  return value
}

function find<T>(
  base: Base,
  paths: SerializedPaths,
  condition: (value: unknown) => boolean
): T | undefined {
  const size = paths.length

  for (let i = 0; i < size; i++) {
    const result = walk(base, paths[i], condition)

    if (result !== undefined) {
      return result as T
    }
  }
}

function walk(
  base: Base,
  path: SerializedPath,
  condition: (value: unknown) => boolean
): unknown {
  const size = path.length

  let parent: unknown

  for (let i = 0; i < size; i++) {
    const isLast = i === size - 1
    const key = path[i]

    if (!isArray(key)) {
      const result = base[key]

      if (result === undefined) {
        return undefined
      }

      if (isLast && condition(result)) {
        return result
      }

      parent = result
      continue
    }

    const result = walk(parent as Base, key as SerializedPath, condition)

    if (result !== undefined && condition(result)) {
      return result
    }

    if (isLast) {
      return undefined
    }
  }
}

function clone<T>(item: T): T {
  return JSON.parse(JSON.stringify(item))
}

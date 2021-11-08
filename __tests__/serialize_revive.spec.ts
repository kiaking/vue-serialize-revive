import { Ref, ref, computed } from '@vue/reactivity'
import { serialize } from '../src/serialize'
import { revive } from '../src/revive'

describe('reactivity/serialize_revive', () => {
  describe('primitives', () => {
    test('plain primitives', () => {
      function useComposable() {
        return { a: 'a', b: 1, c: true }
      }

      const base = useComposable()

      base.a = 'b'
      base.b = 2
      base.c = false

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(base).toEqual({ a: 'b', b: 2, c: false })
    })

    test('plain primitives missing in state', () => {
      function useComposable() {
        return { a: 'a' }
      }

      const base = useComposable()

      ;(base as any).b = 1

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(base).toEqual({ a: 'a', b: 1 })
    })

    test('plain primitives missing in base', () => {
      function useComposable() {
        return { a: 'a', b: 1 }
      }

      const base = useComposable()

      delete (base as any).b

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(base).toEqual({ a: 'a' })
    })
  })

  describe('Function', () => {
    test('Function left untouched', () => {
      function useComposable() {
        return { fn: () => 1 }
      }

      const base = useComposable()

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.fn()).toBe(1)
    })

    test('Function gets removed when missing in entries', () => {
      function useComposable() {
        return { fn: () => 1 }
      }

      const base = useComposable()

      delete (base as any).fn

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.fn).toBe(undefined)
    })
  })

  describe('Ref', () => {
    test('ref primitives', () => {
      function useComposable() {
        return { a: ref('a'), b: ref(1), c: ref(true) }
      }

      const base = useComposable()

      base.a.value = 'b'
      base.b.value = 2
      base.c.value = false

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.a.value).toBe('b')
      expect(state.b.value).toBe(2)
      expect(state.c.value).toBe(false)
    })

    test('ref primitives to non ref value', () => {
      function useComposable() {
        return { a: 'a', b: 1, c: true }
      }

      const base = useComposable()

      ;(base as any).a = ref('b')
      ;(base as any).b = ref(2)
      ;(base as any).c = ref(false)

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect((state as any).a.value).toBe('b')
      expect((state as any).b.value).toBe(2)
      expect((state as any).c.value).toBe(false)
    })

    test('ref primitives with reference', () => {
      function useComposable() {
        const a = ref(1)
        const b = a
        const c = computed(() => b.value * 2)

        return { a, b, c }
      }

      const base = useComposable()

      base.a.value = 2

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.a.value).toBe(2)
      expect(state.b.value).toBe(2)
      expect(state.a === state.b).toBe(true)
      expect(state.c.value === 4)
    })

    test('ref primitives with reference missing key in state', () => {
      function useComposable() {
        return { a: ref(1) }
      }

      const base = useComposable()

      ;(base as any).b = ref(2)

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.a.value).toBe(1)
      expect((state as any).b.value).toBe(2)
    })

    test('ref array', () => {
      function useComposable() {
        return { a: ref([] as number[]) }
      }

      const base = useComposable()

      base.a.value.push(1, 2, 3)

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(base.a.value[0]).toBe(1)
      expect(base.a.value[1]).toBe(2)
      expect(base.a.value[2]).toBe(3)
    })

    test('ref object', () => {
      function useComposable() {
        return { a: ref<Record<string, number>>({}) }
      }

      const base = useComposable()

      base.a.value = { a: 1, b: 2, c: 3 }

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.a.value.a).toBe(1)
      expect(state.a.value.b).toBe(2)
      expect(state.a.value.c).toBe(3)
    })
  })

  describe('Computed', () => {
    test('Computed left untouched', () => {
      function useComposable() {
        const count = ref(1)
        const double = computed(() => count.value * 2)

        return { count, double }
      }

      const base = useComposable()

      base.count.value = 2

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.count.value).toBe(2)
      expect(state.double.value).toBe(4)
    })

    test('Computed gets removed when missing in state', () => {
      function useComposable() {
        const count = ref(1)
        const double = computed(() => count.value * 2)

        return { count, double }
      }

      const base = useComposable()

      base.count.value = 2
      delete (base as any).double

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.count.value).toBe(2)
      expect(state.double).toBe(undefined)
    })
  })

  describe('Array', () => {
    test('plain primitives to empty base', () => {
      function useComposable() {
        return { a: [] as number[] }
      }

      const base = useComposable()

      base.a.push(1, 2, 3)

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state).toEqual({ a: [1, 2, 3] })
    })

    test('plain primitives to missing base', () => {
      function useComposable() {
        return {}
      }

      const base = useComposable()

      ;(base as any).a = [1, 2, 3]

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state).toEqual({ a: [1, 2, 3] })
    })

    test('plain primitives to existing base', () => {
      function useComposable() {
        return { a: ['a', 'b'] }
      }

      const base = useComposable()

      base.a = ['c', 'd']

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state).toEqual({ a: ['c', 'd'] })
    })

    test('plain primitives to mismatching base', () => {
      function useComposable() {
        return { a: [1, 2, 3, 4, 5] }
      }

      const base = useComposable()

      base.a.pop()

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state).toEqual({ a: [1, 2, 3, 4] })
    })

    test('ref primitives to empty base', () => {
      function useComposable() {
        return { a: [] as Ref<number>[] }
      }

      const base = useComposable()

      base.a.push(ref(1), ref(2), ref(3))

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.a[0].value).toEqual(1)
      expect(state.a[1].value).toEqual(2)
      expect(state.a[2].value).toEqual(3)
    })

    test('ref primitives to existing base', () => {
      function useComposable() {
        return {
          items: [] as Ref<number>[]
        }
      }

      const base = useComposable()

      const refA = ref(1)
      base.items.push(refA, refA)

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.items[0].value).toBe(1)
      expect(state.items[1].value).toBe(1)
      expect(state.items[0] === state.items[1]).toBe(true)
    })

    test('ref primitives with reference', () => {
      function useComposable() {
        return {
          refA: ref(1),
          refB: ref(2),
          items: [] as Ref<number>[]
        }
      }

      const base = useComposable()

      base.items.push(base.refA, base.refB)

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.items[0].value).toBe(1)
      expect(state.items[0] === state.refA).toBe(true)
      expect(state.items[1].value).toBe(2)
      expect(state.items[1] === state.refB).toBe(true)
    })

    test('nested plain primitives array to empty base', () => {
      function useComposable() {
        return { items: [] as number[][] }
      }

      const base = useComposable()

      base.items.push([1, 2])
      base.items.push([3, 4])

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(base).toEqual({
        items: [
          [1, 2],
          [3, 4]
        ]
      })
    })

    test('nested ref array with reference', () => {
      function useComposable() {
        return { items: [] as Ref<number>[][] }
      }

      const base = useComposable()

      const v = ref(1)
      base.items.push([v])
      base.items.push([v])

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.items[0][0].value).toBe(1)
      expect(state.items[1][0].value).toBe(1)
      expect(state.items[0][0] === state.items[1][0]).toBe(true)
    })
  })

  describe('Object', () => {
    test('plain primitives to empty base', () => {
      function useComposable() {
        return {
          obj: { keyA: 1, keyB: 2, keyC: 3 }
        }
      }

      const base = useComposable()

      base.obj = { keyA: 2, keyB: 3, keyC: 4 }

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(base).toEqual({
        obj: { keyA: 2, keyB: 3, keyC: 4 }
      })
    })

    test('plain primitives to missing base', () => {
      function useComposable() {
        return { obj: {} }
      }

      const base = useComposable()

      base.obj = { keyA: 2, keyB: 3, keyC: 4 }

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(base).toEqual({
        obj: { keyA: 2, keyB: 3, keyC: 4 }
      })
    })
  })

  describe('circular', () => {
    test('circular reference', () => {
      function useComposable() {
        const a = { v: 1 } as any
        const b = { v: 2 } as any

        return { a, b }
      }

      const base = useComposable()
      ;(base as any).a.b = base.b
      ;(base as any).b.a = base.a

      const entries = serialize(base)

      const state = useComposable()

      revive(state, entries)
      expect(state.a.v).toBe(1)
      expect(state.b.v).toBe(2)
      expect(state.a === state.b.a).toBe(true)
      expect(state.a.b === state.b).toBe(true)
    })
  })
})

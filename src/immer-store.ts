import { computed, reactive, ref, type Ref } from 'vue-demi'
import { enablePatches, produceWithPatches, applyPatches, type Draft, type Patch } from 'immer'

enablePatches()

interface PatchNode {
  redoPatches: Patch[]
  undoPatches: Patch[]
}

function useMigrationStack<T> () {
  const stack = reactive<T[]>([]) as T[]
  const nextIndex = ref(0)

  const hasNext = computed(() => stack.length > nextIndex.value)
  const hasPrev = computed(() => nextIndex.value > 0)

  const push = (item: T) => {
    stack.splice(nextIndex.value)
    stack.push(item)
    nextIndex.value = stack.length
  }
  const clear = () => {
    stack.splice(0)
    nextIndex.value = 0
  }
  const resetWithStep = (step: number) => {
    if (step < 0) {
      const left = Math.max(nextIndex.value + step, 0)
      const result = stack.slice(left, nextIndex.value)
      nextIndex.value = left
      return result
    } else if (step > 0) {
      const right = Math.min(nextIndex.value + step, stack.length)
      const result = stack.slice(nextIndex.value, right)
      nextIndex.value = right
      return result
    } else {
      return []
    }
  }
  return {
    push,
    clear,
    resetWithStep,
    hasNext,
    hasPrev,
  }
}

type State<T> = {
  data: T
}

export function useImmer<T> (initial: T) {
  const initialState = {
    data: initial,
  }

  const state = ref(initialState) as Ref<State<T>>

  const history = useMigrationStack<PatchNode>()

  const produceFunc = (cb: (draft: Draft<T>) => Draft<T> | undefined | void) => {
    const [data, redoPatches, undoPatches] = produceWithPatches<State<T>>(state.value, draft => {
      const ret = cb(draft.data)
      if (ret !== undefined && ret !== draft.data) {
        draft.data = ret
      }
    })
    if (redoPatches.length === 0) {
      return
    }
    history.push({ redoPatches, undoPatches })
    state.value = data
  }

  const undo = () => {
    const patches = history.resetWithStep(-1).map(n => n.undoPatches).reduce((acc, val) => acc.concat(val), [])
    state.value = applyPatches(state.value, patches)
  }

  const redo = () => {
    const patches = history.resetWithStep(1).map(n => n.redoPatches).reduce((acc, val) => acc.concat(val), [])
    state.value = applyPatches(state.value, patches)
  }

  return {
    state: computed(() => state.value.data),
    produce: produceFunc,
    undo,
    redo,
    canUndo: history.hasPrev,
    canRedo: history.hasNext,
    clearHistory: history.clear,
  }
}

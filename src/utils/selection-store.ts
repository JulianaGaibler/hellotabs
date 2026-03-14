import { writable, derived } from 'svelte/store'

interface SelectionState {
  selected: Set<number>
  editMode: boolean
  lastClickedIndex: number | null
}

const initialState: SelectionState = {
  selected: new Set(),
  editMode: false,
  lastClickedIndex: null,
}

export const selectionStore = writable<SelectionState>({ ...initialState })

export function toggleSelect(tabId: number, index?: number) {
  selectionStore.update((state) => {
    const selected = new Set(state.selected)
    if (selected.has(tabId)) {
      selected.delete(tabId)
    } else {
      selected.add(tabId)
    }
    return {
      ...state,
      selected,
      lastClickedIndex: index ?? state.lastClickedIndex,
    }
  })
}

export function selectRange<T extends { id?: number }>(
  fromIndex: number,
  toIndex: number,
  searchResults: T[],
) {
  const start = Math.min(fromIndex, toIndex)
  const end = Math.max(fromIndex, toIndex)
  selectionStore.update((state) => {
    const selected = new Set(state.selected)
    for (let i = start; i <= end; i++) {
      const id = searchResults[i]?.id
      if (id !== undefined) {
        selected.add(id)
      }
    }
    return { ...state, selected, lastClickedIndex: toIndex }
  })
}

export function selectAll<T extends { id?: number }>(searchResults: T[]) {
  selectionStore.update((state) => {
    const selected = new Set<number>()
    for (const tab of searchResults) {
      if (tab.id !== undefined) {
        selected.add(tab.id)
      }
    }
    return { ...state, selected }
  })
}

export function addToSelection(tabId: number, index?: number) {
  selectionStore.update((state) => {
    const selected = new Set(state.selected)
    selected.add(tabId)
    return { ...state, selected, lastClickedIndex: index ?? state.lastClickedIndex }
  })
}

export function deselectAll() {
  selectionStore.update((state) => ({
    ...state,
    selected: new Set(),
    lastClickedIndex: null,
  }))
}

export function enterEditMode() {
  selectionStore.update((state) => ({
    ...state,
    editMode: true,
  }))
}

export function exitEditMode() {
  selectionStore.update(() => ({
    selected: new Set(),
    editMode: false,
    lastClickedIndex: null,
  }))
}

export const selectedCount = derived(selectionStore, ($s) => $s.selected.size)

export const isEditMode = derived(selectionStore, ($s) => $s.editMode)

export function isSelected(tabId: number): boolean {
  let result = false
  selectionStore.subscribe((state) => {
    result = state.selected.has(tabId)
  })()
  return result
}

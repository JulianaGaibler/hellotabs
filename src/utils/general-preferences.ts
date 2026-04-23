import { storageGet, storageSet } from '@src/utils/extension-api'

export enum PREF {
  SHOW_OVERVIEW = 'show-overview',
  SEARCH_ALL_WINDOWS = 'search-all-windows',
  IMPROVED_ACCESSIBILITY = 'improved-accessibility',
  USED_BEFORE = 'usedBefore',
}

export async function getPref(name: PREF) {
  const result = await storageGet(name)
  if (result !== null && result !== undefined) {
    return result
  }
  switch (name) {
    case PREF.SHOW_OVERVIEW:
      return true
    case PREF.SEARCH_ALL_WINDOWS:
      return false
    case PREF.IMPROVED_ACCESSIBILITY:
      return false
    case PREF.USED_BEFORE:
      setPref(PREF.USED_BEFORE, true)
      return false
    default:
      throw new Error('Unknown Pref!')
  }
}

export async function setPref(name: PREF, value: unknown) {
  await storageSet(name, value)
  return value
}

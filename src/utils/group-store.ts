import { queryTabGroups, thisBrowser } from './extension-api'
import { readable } from 'svelte/store'

export type TabGroupMap = {
  [key: number]: Omit<chrome.tabGroups.TabGroup, 'shared'>
}

const tabGroups = readable({} as TabGroupMap, (set) => {
  const updateTabs = () => {
    queryTabGroups({
      windowId: window?.chrome?.windows?.WINDOW_ID_CURRENT,
    }).then((groups) => {
      if (!groups) return
      set(
        groups.reduce((acc, group) => {
          acc[group.id] = group
          return acc
        }, {} as TabGroupMap),
      )
    })
  }

  updateTabs()
  thisBrowser?.tabGroups?.onUpdated.addListener(updateTabs)
  return () => thisBrowser?.tabGroups?.onUpdated.removeListener(updateTabs)
})

export default tabGroups

import type { TabGroupMap } from './group-store'
import * as extAPI from '@src/utils/extension-api'

type ExtendedTab = extAPI.CombinedTab & { groupId?: number }

export type IndexInfo =
  | {
      type: 'tabs'
      groupId?: number
      items: {
        tabIndex: number
        focusIndex: number
      }[]
    }
  | {
      type: 'group'
      groupId: number
      focusIndex: number
      collapsed: boolean
    }

export function findGroups<T extends ExtendedTab>(
  tabs: T[],
  groups: TabGroupMap,
  searchMode: boolean,
): {
  groupIndices: IndexInfo[]
  totalIndices: number
  activeTabIndex: number
} {
  // If there are no tabs, we can skip the rest of the function
  if (tabs.length === 0)
    return {
      groupIndices: [],
      totalIndices: 0,
      activeTabIndex: -1,
    }

  // If this is not Chrome or all groupIds are undefined or -1,
  // we can also skip
  if (
    (!extAPI.hasTabGroupSupport && extAPI.thisBrowser !== undefined) ||
    tabs.every((tab) => tab.groupId === undefined || tab.groupId === -1)
  ) {
    let activeTabIndex = -1
    const groupIndices: IndexInfo[] = [
      {
        type: 'tabs',
        items: tabs.map((tab, index) => {
          if (tab.active) activeTabIndex = index
          return {
            tabIndex: index,
            focusIndex: index,
          }
        }),
      },
    ]
    return {
      groupIndices,
      totalIndices: tabs.length,
      activeTabIndex,
    }
  }

  // If we are here, there are tab groups

  const groupIndices: IndexInfo[] = []
  let currentGroupIndex = NaN
  let currentGroupId = NaN
  let focusIndex = -1
  let activeTabIndex = -1

  for (let i = 0; i < tabs.length; i++) {
    let tab = tabs[i]
    if (tab.groupId === currentGroupId) {
      // There is already an open group we can add to
      const group = groupIndices[currentGroupIndex]
      if (group.type === 'tabs') {
        if (tab.active) activeTabIndex = focusIndex + 1
        group.items.push({
          tabIndex: i,
          focusIndex: ++focusIndex,
        })
      }
    } else {
      // We encountered a new group (including -1)
      // If this is a collapsed group, and we are not in searchMode
      // we only add the group header
      if (
        tab.groupId !== -1 &&
        groups[tab.groupId] &&
        groups[tab.groupId].collapsed &&
        !searchMode
      ) {
        groupIndices.push({
          type: 'group',
          groupId: tab.groupId,
          focusIndex: ++focusIndex,
          collapsed: true,
        })
        while (i < tabs.length && groups[tabs[i].groupId]?.collapsed) {
          i++
        }
        if (i === tabs.length) break
        tab = tabs[i]
      }
      currentGroupId = tab.groupId

      if (currentGroupId !== -1 && !searchMode) {
        groupIndices.push({
          type: 'group',
          groupId: tab.groupId,
          focusIndex: ++focusIndex,
          collapsed: false,
        })
      }
      groupIndices.push({
        type: 'tabs',
        groupId: tab.groupId === -1 ? undefined : tab.groupId,
        items: [
          {
            tabIndex: i,
            focusIndex: ++focusIndex,
          },
        ],
      })
      if (tab.active) activeTabIndex = focusIndex
      currentGroupIndex = groupIndices.length - 1
    }
  }

  return {
    groupIndices,
    totalIndices: focusIndex + 1,
    activeTabIndex,
  }
}

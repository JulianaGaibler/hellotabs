import {
  hasContainerSupport,
  hasTabGroupSupport,
  queryTabs,
  thisBrowser,
  type CombinedTab,
  queryTabGroups,
} from './extension-api'
import stateStore from '@src/utils/state-store'
import { MENU_SEPARATOR, type MenuItem } from 'tint/components/Menu.svelte'

const GROUP_CREATION_THRESHOLD = 3

function actionGuard(fn: () => Promise<void>) {
  return () => {
    stateStore.startAction()
    fn()
      .catch((err) => {
        console.error(err)
        const message = `${err.message}\n\n${err.stack}`
        stateStore.endAction(message)
      })
      .finally(() => stateStore.endAction())
  }
}

const allActions: (MenuItem | boolean)[] = [
  {
    label: 'close-duplicate-tabs',
    onClick: actionGuard(closeDuplicateTabs),
  },
  hasContainerSupport && {
    label: 'close-older-than.label',
    items: [
      { label: 'close-older-than.1hour', onClick: () => closeOlderThan(60) },
      {
        label: 'close-older-than.4hours',
        onClick: () => closeOlderThan(4 * 60),
      },
      {
        label: 'close-older-than.8hours',
        onClick: () => closeOlderThan(8 * 60),
      },
      {
        label: 'close-older-than.1day',
        onClick: () => closeOlderThan(24 * 60),
      },
      {
        label: 'close-older-than.1week',
        onClick: () => closeOlderThan(7 * 24 * 60),
      },
      {
        label: 'close-older-than.1month',
        onClick: () => closeOlderThan(30 * 24 * 60),
      },
    ],
  },
  MENU_SEPARATOR,
  {
    label: 'sort-tabs-by-title',
    onClick: actionGuard(() => sortTabByProperty('title')),
  },
  {
    label: 'sort-tabs-by-url',
    onClick: actionGuard(() => sortTabByProperty('url')),
  },
  hasContainerSupport && {
    label: 'sort-tabs-by-last-accessed',
    onClick: actionGuard(() => sortTabByProperty('lastAccessed')),
  },
  hasContainerSupport && {
    label: 'sort-tabs-by-container',
    onClick: actionGuard(() =>
      sortTabByProperty('cookieStoreId', (a, b) => {
        if (a.cookieStoreId === 'firefox-default') return -1
        if (b.cookieStoreId === 'firefox-default') return 1
        return a.cookieStoreId! > b.cookieStoreId! ? 1 : -1
      }),
    ),
  },
  hasTabGroupSupport && MENU_SEPARATOR,
  hasTabGroupSupport && {
    label: 'group-tabs-by-domain',
    onClick: actionGuard(() =>
      groupTabsBy((tab) => {
        if (tab.url === undefined) return ''
        const hostname = new URL(tab.url).hostname
        return hostname.replace(/^www\d?\./, '')
      }),
    ),
  },
]

export const tabActions = allActions.filter(Boolean) as MenuItem[]

export { closeTabsAbove, closeTabsBelow }

// Close tabs older than X minutes
async function closeOlderThan(minutes: number) {
  const now = Date.now()
  const tabs = await queryTabs({ currentWindow: true })
  const tabsToRemove = tabs.filter(
    (tab) =>
      tab.id !== undefined &&
      !tab.pinned &&
      !tab.hidden &&
      tab.lastAccessed !== undefined &&
      now - tab.lastAccessed > minutes * 60 * 1000,
  )
  await thisBrowser?.tabs.remove(tabsToRemove.map((tab) => tab.id!))
}

async function sortTabByProperty(
  property: keyof CombinedTab,
  sortFn?: (a: CombinedTab, b: CombinedTab) => number,
) {
  const tabs = await queryTabs({ currentWindow: true })
  const groups = tabs.reduce(
    (acc, tab) => {
      const groupId = tab.groupId ?? -1
      if (!acc[groupId]) acc[groupId] = []
      acc[groupId].push(tab)
      return acc
    },
    {} as Record<number, CombinedTab[]>,
  )

  for (const groupTabs of Object.values(groups)) {
    groupTabs.sort((a, b) => {
      // pinned tabs do not get sorted and stay in the current order
      if (a.pinned && b.pinned) return 0
      if (a.pinned) return -1
      if (b.pinned) return 1
      // if the property is not defined, it stays in the current order
      if (a[property] === undefined || b[property] === undefined) {
        return 0
      }
      // if a sort function is provided, use it
      if (sortFn) return sortFn(a, b)
      // otherwise, sort by the property
      return a[property]! > b[property]! ? 1 : -1
    })
  }

  const sortedTabs = Object.values(groups).flat()
  await thisBrowser?.tabs.move(
    sortedTabs.map((tab) => tab.id!),
    { index: 0 },
  )
  // tabgroups might get lost, so we need to re-group them
  for (const [groupId, groupTabs] of Object.entries(groups)) {
    if (groupId === '-1') continue
    await thisBrowser?.tabs.group({
      tabIds: groupTabs.map((tab) => tab.id!),
      groupId: parseInt(groupId),
    })
  }
}

async function groupTabsBy(groupFn: (tab: CombinedTab) => string) {
  const windowId = chrome.windows.WINDOW_ID_CURRENT
  const tabs = (await queryTabs({ windowId })).filter(
    (tab) => !tab.pinned && !tab.hidden && tab.groupId === -1,
  )
  const groups = tabs.reduce(
    (acc, tab) => {
      const key = groupFn(tab)
      if (!acc[key]) acc[key] = []
      acc[key].push(tab)
      return acc
    },
    {} as Record<string, CombinedTab[]>,
  )
  const groupArray = Object.entries(groups)

  // filter tabs where GROUP_CREATION_THRESHOLD is not met
  const filteredGroupArray = groupArray
    .filter(([, tabs]) => tabs.length >= GROUP_CREATION_THRESHOLD)
    // and filter tabs where the name is an empty string
    .filter(([name]) => name !== '')

  for (const [name, tabs] of filteredGroupArray) {
    const queryResult = await queryTabGroups({ windowId, title: name })
    // if there are no results, we create a new group
    if (queryResult.length === 0) {
      const groupId = await chrome.tabs.group({
        createProperties: { windowId },
        tabIds: tabs.map((tab) => tab.id!),
      })
      await chrome.tabGroups.update(groupId, {
        title: name,
      })
    } else {
      // we pick the first group and add the tabs to it
      const groupId = queryResult[0].id
      await chrome.tabs.group({
        tabIds: tabs.map((tab) => tab.id!),
        groupId: groupId,
      })
    }
  }
}

async function closeTabsAbove(currentTabId: number) {
  const tabs = await queryTabs({ currentWindow: true })
  const currentTabIndex = tabs.findIndex(tab => tab.id === currentTabId)

  if (currentTabIndex <= 0) return // No tabs above or tab not found

  const tabsToClose = tabs
    .slice(0, currentTabIndex)
    .filter(tab => !tab.pinned && tab.id !== undefined)
    .map(tab => tab.id!)

  if (tabsToClose.length > 0) {
    await thisBrowser?.tabs.remove(tabsToClose)
  }
}

async function closeTabsBelow(currentTabId: number) {
  const tabs = await queryTabs({ currentWindow: true })
  const currentTabIndex = tabs.findIndex(tab => tab.id === currentTabId)

  if (currentTabIndex === -1 || currentTabIndex >= tabs.length - 1) return // Tab not found or no tabs below

  const tabsToClose = tabs
    .slice(currentTabIndex + 1)
    .filter(tab => !tab.pinned && tab.id !== undefined)
    .map(tab => tab.id!)

  if (tabsToClose.length > 0) {
    await thisBrowser?.tabs.remove(tabsToClose)
  }
}

async function closeDuplicateTabs() {
  const tabs = await queryTabs({ currentWindow: true })
  const groups = tabs.reduce(
    (acc, tab) => {
      if (tab.id === undefined || tab.pinned || tab.hidden) return acc
      const url = cleanURL(tab.url!)
      if (!acc[url]) acc[url] = []
      acc[url].push(tab)
      return acc
    },
    {} as Record<string, CombinedTab[]>,
  )
  for (const [, tabs] of Object.entries(groups)) {
    if (tabs.length > 1) {
      await thisBrowser?.tabs.remove(tabs.slice(1).map((tab) => tab.id!))
    }
  }
}

function cleanURL(url: string) {
  const urlObj = new URL(url)
  urlObj.hash = ''
  // strip query parameters that are used for tracking
  for (const param of STRIP) {
    urlObj.searchParams.delete(param)
  }
  return urlObj.toString()
}

const STRIP = [
  'mc_eid',
  'oly_anon_id',
  'oly_enc_id',
  '__s',
  'vero_id',
  '_hsenc',
  'mkt_tok',
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  '_openstat',
  'yclid',
  'wickedid',
  'twclid',
  '_hsenc',
  '__hssc',
  '__hstc',
  '__hsfp',
  'hsctatracking',
  'wbraid',
  'gbraid',
  'ysclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_cid',
  'utm_reader',
  'utm_name',
  'utm_pubreferrer',
]

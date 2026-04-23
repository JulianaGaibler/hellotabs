export type CombinedBrowserAPI = typeof browser & typeof chrome
export type CombinedTab = browser.tabs.Tab & chrome.tabs.Tab

const win = window as unknown as {
  browser?: typeof browser
  chrome?: typeof chrome
}
export const thisBrowser: CombinedBrowserAPI | undefined =
  win.browser || win.chrome?.tabs
    ? (win.chrome as CombinedBrowserAPI)
    : undefined

export const hasTabGroupSupport =
  !thisBrowser || window?.chrome?.tabGroups !== undefined

export const hasContainerSupport =
  !thisBrowser || window?.browser?.contextualIdentities !== undefined

export async function queryTabGroups(
  options: Parameters<typeof window.chrome.tabGroups.query>[0],
) {
  if (!thisBrowser) {
    const { GROUPS } = await import('./mock-data')
    return GROUPS as chrome.tabGroups.TabGroup[]
  }
  if (!thisBrowser.tabGroups) {
    return []
  }
  return await thisBrowser.tabGroups.query(options)
}

export async function queryContainers(
  options: Parameters<typeof window.browser.contextualIdentities.query>[0],
) {
  if (!thisBrowser) {
    const { CONTAINERS } = await import('./mock-data')
    return CONTAINERS as browser.contextualIdentities.ContextualIdentity[]
  }
  return await thisBrowser.contextualIdentities.query(options)
}

export async function queryTabs(
  options: Parameters<typeof browser.tabs.query>[0],
) {
  if (!thisBrowser) {
    const { TABS } = await import('./mock-data')
    return TABS as CombinedTab[]
  }
  return (await thisBrowser.tabs.query(options)) as CombinedTab[]
}

export function openTab(id: number) {
  updateTabs(id, { active: true })
  window.close()
}

export function updateTabs(
  id: Parameters<typeof browser.tabs.update>[0],
  obj: Parameters<typeof browser.tabs.update>[1],
) {
  if (!thisBrowser) {
    return
  }
  return thisBrowser.tabs.update(id, obj)
}

export function updateGroup(
  id: Parameters<typeof chrome.tabGroups.update>[0],
  obj: Parameters<typeof chrome.tabGroups.update>[1],
) {
  if (!thisBrowser) {
    return
  }
  return thisBrowser.tabGroups.update(id, obj)
}

export function closeTab(id: Parameters<typeof browser.tabs.remove>[0]) {
  if (!thisBrowser) {
    return
  }
  return thisBrowser.tabs.remove(id)
}

export async function shortcutGet(key: string) {
  if (!thisBrowser) {
    return Promise.resolve('alt+space')
  }
  const commands = await thisBrowser.commands.getAll()
  return commands.find((c) => c.name === key)?.shortcut
}

export async function storageGet(key: string) {
  if (!thisBrowser) {
    return Promise.resolve(lsGet(key))
  }
  const res = await thisBrowser.storage.sync.get(key)
  return res[key]
}

export function storageSet(key: string, value: unknown) {
  if (!thisBrowser) {
    return Promise.resolve(lsSet(key, value))
  }
  return thisBrowser.storage.sync.set({ [key]: value })
}

export function storageRemove(key: string) {
  if (!thisBrowser) {
    return Promise.resolve(lsRemove(key))
  }
  return thisBrowser.storage.sync.remove(key)
}

// Localstorage can only hold string-values (which isn't the case for the storage API extension use).
// These functions should mimick the actual add-on storage api sufficiently
function getStore() {
  const store = localStorage.getItem('fake-store')
  return store ? JSON.parse(store) : {}
}
function setStore(store: Record<string, unknown>) {
  localStorage.setItem('fake-store', JSON.stringify(store))
}
function lsGet(key: string) {
  return getStore()[key]
}
function lsSet(key: string, value: unknown) {
  const store = getStore()
  store[key] = value
  setStore(store)
}
function lsRemove(key: string) {
  const store = getStore()
  delete store[key]
  setStore(store)
}

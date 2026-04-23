<script lang="ts">
  import { _ } from 'svelte-i18n'
  import Button from 'tint/components/Button.svelte'
  import Menu, {
    MENU_SEPARATOR,
    type ContextClickHandler,
    type MenuItem,
  } from 'tint/components/Menu.svelte'
  import HelloTabsIcon from '@src/assets/hellotabs-icon.svg?raw'
  import HelloTabsNoResult from '@src/assets/cat_noresults.svg?raw'
  import iconDropdown from 'tint/icons/14-dropdown.svg?raw'
  import TabItem from '@src/components/TabItem.svelte'
  import SelectionBar from '@src/components/SelectionBar.svelte'
  import tabs from '@src/utils/tab-store'
  import Fuse from 'fuse.js'
  import fuseHighlight, { type HighlightResult } from './utils/fuse-highlight'
  import * as extAPI from '@src/utils/extension-api'
  import { findGroups, type IndexInfo } from './utils/tab-utils'
  import tabGroups from '@src/utils/group-store'
  import stateStore from '@src/utils/state-store'
  import GroupItem from './components/GroupItem.svelte'
  import {
    tabActions,
    closeTabsAbove,
    closeTabsBelow,
    moveTabs,
  } from './utils/tab-actions'
  import { reorderable, type ReorderEventDetail } from 'tint/actions'
  import { onMount, untrack } from 'svelte'
  import {
    selectionStore,
    toggleSelect,
    selectRange,
    selectAll,
    deselectAll,
    exitEditMode,
    addToSelection,
  } from '@src/utils/selection-store'

  const INDEX_OPTIONS = { keys: ['title', 'url'], includeMatches: true }

  interface Props {
    ontogglepreferences?: () => void
  }

  let { ontogglepreferences = undefined }: Props = $props()

  let searchString = $state('')
  let fuse: Fuse<extAPI.CombinedTab> | null = $state(null)
  let lastFuseFingerprint = ''

  let contextClick: ContextClickHandler | undefined = $state(undefined)

  let focus: [number, number] = $state([-1, 0])
  let searchFieldFocus = $state(true)
  let searchField: HTMLInputElement | null = $state(null)
  let focusLeftFns = $state<Record<string, () => void>>({})
  let focusRightFns = $state<Record<string, () => void>>({})
  let contextClickHandlers = $state<ContextClickHandler | undefined>(undefined)
  let contextMenuItems = $state<MenuItem[]>([])
  let searchResults = $state<HighlightResult<extAPI.CombinedTab>[]>([])
  let groupResults = $state<
    ReturnType<typeof findGroups<HighlightResult<extAPI.CombinedTab>>>
  >({
    groupIndices: [],
    totalIndices: 0,
    activeTabIndex: 0,
  })

  let hasSelection = $derived($selectionStore.selected.size > 0)
  let editMode = $derived($selectionStore.editMode)
  let isSearching = $derived(searchString.trim().length > 0)
  let pendingFocusTabId: number | null = $state(null)

  function handleReorder(detail: ReorderEventDetail) {
    if (isSearching) return
    const draggedTabId = Number(
      detail.draggedElement.getAttribute('data-tab-id'),
    )
    const targetTabId = Number(detail.targetElement.getAttribute('data-tab-id'))
    if (!draggedTabId || !targetTabId) return
    pendingFocusTabId = draggedTabId
    moveTabs(
      draggedTabId,
      targetTabId,
      detail.position,
      $tabs,
      $selectionStore.selected,
    )
  }

  function handleSelectionClick(
    tabId: number,
    event: MouseEvent | KeyboardEvent,
  ) {
    if (
      event instanceof MouseEvent &&
      event.shiftKey &&
      $selectionStore.lastClickedIndex !== null
    ) {
      // Find index of current tab in searchResults
      const currentIndex = searchResults.findIndex((t) => t.id === tabId)
      if (currentIndex !== -1) {
        selectRange(
          $selectionStore.lastClickedIndex,
          currentIndex,
          searchResults,
        )
      }
    } else {
      const currentIndex = searchResults.findIndex((t) => t.id === tabId)
      toggleSelect(tabId, currentIndex !== -1 ? currentIndex : undefined)
    }
  }

  function updateFuseInstance(tabs: extAPI.CombinedTab[]) {
    const fingerprint = tabs
      .map((t) => `${t.id}|${t.title}|${t.url}`)
      .join('\n')
    if (fingerprint === lastFuseFingerprint && fuse) {
      fuse.setCollection(tabs)
      return
    }
    lastFuseFingerprint = fingerprint
    const index = Fuse.createIndex(INDEX_OPTIONS.keys, tabs)
    if (!fuse) {
      fuse = new Fuse(tabs, INDEX_OPTIONS, index)
    } else {
      fuse.setCollection(tabs, index)
    }
  }

  function searchTabs(
    tabs: extAPI.CombinedTab[],
    searchString: string,
    fuse: Fuse<extAPI.CombinedTab> | null,
    showOverview: boolean,
  ): HighlightResult<extAPI.CombinedTab>[] {
    const noSearch = searchString.trim().length === 0
    if (!showOverview && noSearch) {
      return []
    }
    if (!fuse || noSearch) {
      return tabs as HighlightResult<extAPI.CombinedTab>[]
    }
    const results = fuseHighlight(fuse.search(searchString))
    focus = [results.length === 0 ? -1 : 0, focus[1]]
    return results
  }

  function onUpdateListItems(r: IndexInfo[]) {
    const noSearch = searchString.trim().length === 0
    if (noSearch || !fuse) {
      if (focus[0] === -1) {
        focus = [groupResults.activeTabIndex, 0]
      }
      return
    }
    if (r.length === 0) {
      focus = [-1, 0]
    } else {
      // search for the first result that is not a group
      let i = 0
      while (i < r.length && r[i].type === 'group') i++
      if (i < r.length) focus = [i, focus[1]]
      else focus = [-1, focus[1]]
    }
  }

  $effect(() => {
    updateFuseInstance($tabs)
    if (
      searchString === undefined ||
      $tabs === undefined ||
      fuse === null ||
      $stateStore.preferences === undefined ||
      $tabGroups === undefined
    )
      return

    untrack(async () => {
      searchResults = searchTabs(
        $tabs,
        searchString,
        fuse,
        $stateStore.preferences?.showOverview || false,
      )
      groupResults = findGroups(
        searchResults,
        $tabGroups,
        searchString.trim().length > 0 ||
          !$stateStore.preferences?.showGroupTabs,
      )
      onUpdateListItems(groupResults.groupIndices)

      // After reorder, focus the moved tab at its new position
      if (pendingFocusTabId !== null) {
        const tabId = pendingFocusTabId
        pendingFocusTabId = null
        for (const item of groupResults.groupIndices) {
          if (item.type === 'tabs') {
            for (const tabInfo of item.items) {
              if (searchResults[tabInfo.tabIndex]?.id === tabId) {
                focus = [tabInfo.focusIndex, 0]
                searchFieldFocus = false
                break
              }
            }
          }
        }
      }
    })
  })

  let localizedTabActions = $derived.by<MenuItem[]>(() => {
    return tabActions.map((item) => {
      if (typeof item === 'object' && 'label' in item) {
        const obj: MenuItem = {
          ...item,
          label: $_(item.label),
        }
        if ('items' in item && item.items) {
          ;(obj as Extract<MenuItem, { items: MenuItem[] }>).items = (
            item as Extract<MenuItem, { items: MenuItem[] }>
          ).items.map((subItem) => {
            if (typeof subItem === 'object' && 'label' in subItem) {
              return {
                ...subItem,
                label: $_(subItem.label),
              }
            }
            return subItem
          })
        }
        return obj
      }
      return item
    })
  })

  onMount(() => {
    searchField?.focus()
  })

  function handleKeydown(e: KeyboardEvent) {
    // Let Ctrl+Shift+Arrow propagate to reorderable action
    if (
      (e.key === 'ArrowDown' || e.key === 'ArrowUp') &&
      e.ctrlKey &&
      e.shiftKey
    ) {
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      searchFieldFocus = false
      if (e.shiftKey) {
        shiftArrowSelect(1)
      } else {
        changeFocus(1)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      searchFieldFocus = false
      if (e.shiftKey) {
        shiftArrowSelect(-1)
      } else {
        changeFocus(-1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      searchFieldFocus = false
      const key = getTabAtFocus(focus[0])?.id || '_'
      focusLeftFns[key]?.()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      searchFieldFocus = false
      const key = getTabAtFocus(focus[0])?.id || '_'
      focusRightFns[key]?.()
    } else if (
      e.key === 'ContextMenu' ||
      (e.key === 'F10' && e.shiftKey) ||
      (e.key === 'm' && (e.ctrlKey || e.metaKey))
    ) {
      e.preventDefault()
      const focusedTab = getTabAtFocus(focus[0])
      if (!searchFieldFocus && focus[0] >= 0 && focusedTab) {
        const contextHandler = handleContextMenu(focusedTab)

        // Create a synthetic mouse event with coordinates for the context menu
        const syntheticEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 20, // Center of window
          clientY: 20, // Center of window
        })

        contextHandler(syntheticEvent)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if ($selectionStore.editMode) {
        exitEditMode()
      } else if ($selectionStore.selected.size > 0) {
        deselectAll()
      }
    } else if (
      e.key === ' ' &&
      !searchFieldFocus &&
      focus[0] >= 0 &&
      focus[1] === 0
    ) {
      e.preventDefault()
      const tab = getTabAtFocus(focus[0])
      if (tab?.id !== undefined) {
        const currentIndex = focus[0]
        toggleSelect(tab.id, currentIndex)
      }
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      selectAll(searchResults)
    } else if (e.key === 'Backspace' && searchString.trim().length > 0) {
      searchField?.focus()
    } else if (
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      e.key !== ' '
    ) {
      searchField?.focus()
    }
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const tabId = getTabAtFocus(focus[0])?.id
      if (tabId) {
        extAPI.openTab(tabId)
      }
    } else {
      focus = [focus[0], 0]
    }
  }

  function shiftArrowSelect(direction: -1 | 1) {
    const currentTab = getTabAtFocus(focus[0])
    if (currentTab?.id !== undefined) addToSelection(currentTab.id, focus[0])
    if (focus[1] > 0) focus = [focus[0], 0]
    changeFocus(direction)
    const newTab = getTabAtFocus(focus[0])
    if (newTab?.id !== undefined) addToSelection(newTab.id, focus[0])
  }

  function changeFocus(diff: -1 | 0 | 1 = 0) {
    const newFocus = focus[0] + diff
    if (newFocus < 0 || newFocus >= groupResults.totalIndices) {
      return
    }

    focus = [newFocus, focus[1]]
  }

  function handleFocusChange(index: number) {
    if (index === undefined || index === -1) {
      changeFocus(0)
    } else {
      focus = [index, 0]
      changeFocus(0)
    }
  }

  function createContextMenu(
    tab: HighlightResult<extAPI.CombinedTab>,
  ): MenuItem[] {
    // Find current tab index in the original tabs array
    const currentTabIndex = $tabs.findIndex((t) => t.id === tab.id)

    // Find tabs above and below (excluding pinned tabs)
    const tabsAbove =
      currentTabIndex > 0
        ? $tabs.slice(0, currentTabIndex).filter((t) => !t.pinned)
        : []
    const tabsBelow =
      currentTabIndex >= 0 && currentTabIndex < $tabs.length - 1
        ? $tabs.slice(currentTabIndex + 1).filter((t) => !t.pinned)
        : []

    // Check if current tab is pinned
    const isCurrentTabPinned = tab.pinned

    return [
      {
        label: tab.pinned ? $_('unpin-tab-button') : $_('pin-tab-button'),
        onClick: () => {
          if (tab.id) {
            extAPI.updateTabs(tab.id, { pinned: !tab.pinned })
          }
        },
      },
      MENU_SEPARATOR, // separator
      {
        label: $_('close-tabs-above'),
        disabled: isCurrentTabPinned || tabsAbove.length === 0,
        onClick: () => {
          if (tab.id) {
            closeTabsAbove(tab.id)
          }
        },
      },
      {
        label: $_('close-tabs-below'),
        disabled: isCurrentTabPinned || tabsBelow.length === 0,
        onClick: () => {
          if (tab.id) {
            closeTabsBelow(tab.id)
          }
        },
      },
      MENU_SEPARATOR, // separator
      {
        label: $_('close-tab-button'),
        onClick: () => {
          if (tab.id) {
            extAPI.closeTab(tab.id)
          }
        },
      },
    ]
  }

  function getTabAtFocus(
    focusIdx: number,
  ): HighlightResult<extAPI.CombinedTab> | undefined {
    for (const item of groupResults.groupIndices) {
      if (item.type !== 'tabs') continue
      for (const tabInfo of item.items) {
        if (tabInfo.focusIndex === focusIdx) {
          return searchResults[tabInfo.tabIndex]
        }
      }
    }
    return undefined
  }

  function handleContextMenu(tab: HighlightResult<extAPI.CombinedTab>) {
    return (e: Event) => {
      contextMenuItems = createContextMenu(tab)
      contextClickHandlers?.(e)
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="tint--tinted">
  <Button
    icon={true}
    variant="ghost"
    title={$_('preferences-button')}
    onclick={ontogglepreferences}>{@html HelloTabsIcon}</Button
  >
  <input
    type="search"
    placeholder={$_('search-input.placeholder')}
    aria-label={$_('search-input.aria-label')}
    spellcheck="false"
    class="tint--type-body-sans"
    bind:value={searchString}
    bind:this={searchField}
    onfocus={() => (searchFieldFocus = true)}
    onblur={() => (searchFieldFocus = false)}
    onkeydown={handleInputKeydown}
  />
  <button
    class="tabs"
    onclick={contextClick}
    onmousedown={contextClick}
    title={$_('search-tab-counter', { values: { n: $tabs.length } })}
  >
    <span>{$tabs.length}</span>
    {@html iconDropdown}
  </button>
  <Menu variant="button" items={localizedTabActions} bind:contextClick />
</header>

<Menu
  bind:contextClick={contextClickHandlers}
  variant="context"
  items={contextMenuItems}
/>

<!-- if search term and no results -->
{#if searchString.trim().length > 0 && searchResults.length === 0}
  <div class="no-result tint--tinted">
    {@html HelloTabsNoResult}
    <h2 class="tint--type-title-sans-3">{$_('search-no-result')}</h2>
  </div>
{:else}
  <div class="main-area" tabindex="-1">
    {#if hasSelection || editMode}
      <SelectionBar {searchResults} />
    {/if}
    {#each groupResults.groupIndices as item, i (i)}
      {#if item.type === 'group'}
        <GroupItem
          groupId={item.groupId}
          bind:focus
          onactionat={handleFocusChange}
          claimFocus={!searchFieldFocus}
          nth={item.focusIndex}
          collapsed={item.collapsed}
        />
      {:else if item.type === 'tabs'}
        <ul
          id={`group-${item.groupId || ''}`}
          use:reorderable={{
            itemSelector: 'li',
            handleSelector: editMode ? '.drag-handle' : undefined,
            enableKeyboardReorder: !isSearching,
            onreorder: handleReorder,
            dropGroup: 'tabs',
          }}
        >
          {#each item.items as tabInfo (searchResults[tabInfo.tabIndex].id)}
            <TabItem
              tab={searchResults[tabInfo.tabIndex]}
              nth={tabInfo.focusIndex}
              bind:focus
              bind:focusLeft={
                focusLeftFns[searchResults[tabInfo.tabIndex].id || '_']
              }
              bind:focusRight={
                focusRightFns[searchResults[tabInfo.tabIndex].id || '_']
              }
              selected={$selectionStore.selected.has(
                searchResults[tabInfo.tabIndex].id ?? -1,
              )}
              {editMode}
              onselect={handleSelectionClick}
              onactionat={handleFocusChange}
              onfocusset={(index) => {
                if (index === 0) {
                  focus = [0, 0]
                  changeFocus(0)
                } else if (index === 1) {
                  focus = [searchResults.length - 1, 0]
                  changeFocus(0)
                }
              }}
              oncontextmenu={handleContextMenu(searchResults[tabInfo.tabIndex])}
              claimFocus={!searchFieldFocus}
            />
          {/each}
        </ul>
      {/if}
    {/each}
  </div>
{/if}

<style lang="sass">
  input
    flex: 1
    background: none
    border: none
    color: var(--tint-text)
    font-family: inherit
    height: 100%
    &::-webkit-search-cancel-button
      display: none
    &:focus
      outline: none
    &::placeholder
      opacity: 0.5
      color: var(--tint-text)
  .tabs
    border: none
    background: var(--tint-input-bg)
    padding: tint.$size-4 + tint.$size-2
    padding-block-start: tint.$size-4 + tint.$size-2 + 2px
    border-radius: tint.$size-8
    line-height: 1
    display: flex
    align-items: center
    margin-inline-end: tint.$size-8
    gap: tint.$size-2
    > :global(*)
      pointer-events: none
    > :global(svg)
      width: 8px
      height: 8px

  .main-area
    :global(li.dragging)
      opacity: 0.5
    :global(li[draggable="true"]:hover)
      cursor: grab
    :global(li[draggable="true"]:active)
      cursor: grabbing

  .main-area, ul, .no-result
    display: flex
    flex-direction: column
  ul
    list-style: none

  .no-result
    justify-content: center
    align-items: center
    height: 100%
    flex-grow: 1
    gap: tint.$size-16
    margin-block: tint.$size-32
</style>

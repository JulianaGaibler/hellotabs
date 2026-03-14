<script lang="ts">
  import { _ } from 'svelte-i18n'
  import Button from 'tint/components/Button.svelte'
  import Toggleable from 'tint/components/Toggleable.svelte'
  import iconPin from 'tint/icons/20-push-pin.svg?raw'
  import iconClose from 'tint/icons/20-close.svg?raw'
  import iconCollectionAdd from 'tint/icons/20-collection-add.svg?raw'
  import Menu, {
    MENU_SEPARATOR,
    type MenuItem,
  } from 'tint/components/Menu.svelte'
  import {
    selectionStore,
    selectAll,
    deselectAll,
    exitEditMode,
  } from '@src/utils/selection-store'
  import {
    closeTabs,
    pinTabs,
    addTabsToGroup,
  } from '@src/utils/tab-actions'
  import { hasTabGroupSupport, queryTabGroups } from '@src/utils/extension-api'
  import type { HighlightResult } from '@src/utils/fuse-highlight'
  import type { CombinedTab } from '@src/utils/extension-api'

  interface Props {
    searchResults: HighlightResult<CombinedTab>[]
  }

  let { searchResults }: Props = $props()

  let selectedIds = $derived(Array.from($selectionStore.selected))
  let selectedCount = $derived($selectionStore.selected.size)
  let totalCount = $derived(searchResults.length)
  let allSelected = $derived(
    totalCount > 0 && selectedCount === totalCount,
  )
  let editMode = $derived($selectionStore.editMode)

  // Check if all selected tabs are pinned
  let allSelectedPinned = $derived.by(() => {
    if (selectedIds.length === 0) return false
    return selectedIds.every((id) => {
      const tab = searchResults.find((t) => t.id === id)
      return tab?.pinned
    })
  })

  function handleSelectAllToggle() {
    if (allSelected) {
      deselectAll()
    } else {
      selectAll(searchResults)
    }
  }

  function handlePin() {
    pinTabs(selectedIds, !allSelectedPinned)
    deselectAll()
  }

  function handleClose() {
    closeTabs(selectedIds)
    deselectAll()
  }

  function handleDone() {
    exitEditMode()
  }

  // Group menu
  let groupContextClick: ((e: Event) => void) | undefined = $state(undefined)
  let groupMenuItems = $state<MenuItem[]>([])

  async function buildGroupMenu() {
    const items: MenuItem[] = []
    if (hasTabGroupSupport && typeof chrome !== 'undefined') {
      const groups = await queryTabGroups({})
      for (const group of groups) {
        items.push({
          label: group.title || `Group ${group.id}`,
          onClick: () => {
            addTabsToGroup(selectedIds, group.id)
            deselectAll()
          },
        })
      }
      if (items.length > 0) {
        items.push(MENU_SEPARATOR)
      }
    }
    items.push({
      label: $_('batch-new-group'),
      onClick: () => {
        addTabsToGroup(selectedIds)
        deselectAll()
      },
    })
    groupMenuItems = items
  }

  function handleGroupClick(e: Event) {
    buildGroupMenu().then(() => {
      groupContextClick?.(e)
    })
  }

  let actionButtons: HTMLButtonElement[] = $state([])

  function handleToolbarKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const focusable = actionButtons.filter(Boolean)
      const currentIndex = focusable.indexOf(
        document.activeElement as HTMLButtonElement,
      )
      if (currentIndex === -1) return
      const next =
        e.key === 'ArrowRight'
          ? (currentIndex + 1) % focusable.length
          : (currentIndex - 1 + focusable.length) % focusable.length
      focusable[next]?.focus()
    }
  }
</script>

<div
  class="selection-bar tint--tinted"
  role="toolbar"
  tabindex="0"
  aria-label={$_('selection-bar-label', { default: 'Selected tabs actions' })}
  onkeydown={handleToolbarKeydown}
>
  <div class="selection-bar-left">
    <Toggleable
      id="select-all-toggle"
      type="checkbox"
      checked={allSelected}
      onchange={handleSelectAllToggle}
      aria-label={allSelected ? $_('deselect-all-tabs') : $_('select-all-tabs')}
    />
    <span class="tint--type-ui" aria-live="polite">
      {$_('selection-count', { values: { n: selectedCount } })}
    </span>
  </div>
  <div class="selection-bar-right">
    {#if hasTabGroupSupport}
      <Button
        bind:element={actionButtons[0]}
        icon={true}
        variant="ghost"
        small={true}
        title={$_('batch-add-to-group')}
        onclick={handleGroupClick}
      >{@html iconCollectionAdd}</Button>
      <Menu variant="button" items={groupMenuItems} bind:contextClick={groupContextClick} />
    {/if}
    <Button
      bind:element={actionButtons[1]}
      icon={true}
      variant="ghost"
      small={true}
      title={allSelectedPinned ? $_('batch-unpin-tabs') : $_('batch-pin-tabs')}
      onclick={handlePin}
      disabled={selectedCount === 0}
    >{@html iconPin}</Button>
    <Button
      bind:element={actionButtons[2]}
      icon={true}
      variant="ghost"
      small={true}
      title={$_('batch-close-tabs')}
      onclick={handleClose}
      disabled={selectedCount === 0}
    >{@html iconClose}</Button>
    <Button
      bind:element={actionButtons[3]}
      variant="ghost"
      small={true}
      onclick={handleDone}
    >{$_('exit-edit-mode')}</Button>
  </div>
</div>

<style lang="sass">
  .selection-bar
    display: flex
    align-items: center
    justify-content: space-between
    padding: tint.$size-8 tint.$size-12
    position: sticky
    top: 0
    z-index: 10
    background: var(--tint-bg)
    border-bottom: 1px solid var(--tint-input-bg)

  .selection-bar-left
    display: flex
    align-items: center
    gap: tint.$size-8

  .selection-bar-right
    display: flex
    align-items: center
    gap: tint.$size-4
</style>

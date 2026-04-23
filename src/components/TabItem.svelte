<script lang="ts">
  import { _ } from 'svelte-i18n'
  import Button from 'tint/components/Button.svelte'
  import Toggleable from 'tint/components/Toggleable.svelte'
  import HelloTabsIcon from '@src/assets/icon.svg?raw'
  import iconAudio from 'tint/icons/20-volume-off.svg?raw'
  import iconAudioOff from 'tint/icons/20-volume-up.svg?raw'
  import iconPin from 'tint/icons/20-push-pin.svg?raw'
  import iconPinFill from 'tint/icons/20-push-pin-fill.svg?raw'
  import iconClose from 'tint/icons/20-close.svg?raw'
  import iconDragHandle from 'tint/icons/14-drag-handle.svg?raw'
  import { onMount } from 'svelte'
  import type { HighlightResult } from '@src/utils/fuse-highlight'
  import * as extAPI from '@src/utils/extension-api'
  import tabGroups from '@src/utils/group-store'
  import containers from '@src/utils/container-store'
  import containerIcons from '@src/utils/container-icons'
  import stateStore from '@src/utils/state-store'

  interface Props {
    tab: HighlightResult<extAPI.CombinedTab>
    nth: number
    focus: [number, number]
    claimFocus: boolean
    selected?: boolean
    editMode?: boolean
    onselect?: (tabId: number, event: MouseEvent | KeyboardEvent) => void
    onactionat?: (index: number) => void
    onfocusset?: (index: number) => void
    oncontextmenu?: (e: Event) => void
    focusLeft?: () => void
    focusRight?: () => void
  }

  let {
    tab,
    nth,
    focus = $bindable(),
    claimFocus,
    selected = false,
    editMode = false,
    onselect = undefined,
    onactionat = undefined,
    onfocusset = undefined,
    oncontextmenu = undefined,
    focusLeft = $bindable(undefined),
    focusRight = $bindable(undefined),
  }: Props = $props()

  let buttons: (HTMLElement | undefined)[] = $state([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ])

  let checkboxEl: HTMLInputElement | HTMLButtonElement | undefined =
    $state(undefined)

  $effect(() => {
    buttons[0] = editMode ? checkboxEl : undefined
    if (checkboxEl) {
      checkboxEl.tabIndex = editMode && isFocused(focus, 0) ? 0 : -1
    }
  })

  onMount(() => {
    focusElement(focus)
  })

  const focusLeftFn = () => {
    if (!claimFocus) return
    else if (document.dir == 'rtl') moveFocusRight()
    else moveFocusLeft()
  }
  const focusRightFn = () => {
    if (!claimFocus) return
    else if (document.dir == 'rtl') moveFocusLeft()
    else moveFocusRight()
  }

  focusLeft = focusLeftFn
  focusRight = focusRightFn

  function resolveActualIndex(): number {
    if (buttons[focus[1]]) return focus[1]
    for (let i = focus[1]; i < buttons.length; i++) {
      if (buttons[i]) return i
    }
    return focus[1]
  }

  function moveFocusLeft() {
    let current = resolveActualIndex()
    while (current > 0) {
      current--
      if (buttons[current]) {
        focus = [focus[0], current]
        return
      }
    }
  }
  function moveFocusRight() {
    let current = resolveActualIndex()
    while (current < buttons.length - 1) {
      current++
      if (buttons[current]) {
        focus = [focus[0], current]
        return
      }
    }
  }

  function focusElement(f: [number, number]) {
    if (f[0] !== nth) return
    buttons[1]?.scrollIntoView({
      behavior: claimFocus ? 'smooth' : 'instant',
      block: claimFocus ? 'nearest' : 'center',
    })
    if (!claimFocus) return
    for (let i = f[1]; i < buttons.length; i++) {
      if (buttons[i]) {
        buttons[i]?.focus()
        return
      }
    }
  }

  function isFocused(f: [number, number], i: number) {
    return f[0] === nth && f[1] === i
  }

  function handleTabClick(e: MouseEvent) {
    // Ctrl/Cmd+click or Shift+click: selection
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault()
      if (tab?.id !== undefined) {
        onselect?.(tab.id, e)
      }
      return
    }
    // In edit mode: toggle selection
    if (editMode) {
      e.preventDefault()
      if (tab?.id !== undefined) {
        onselect?.(tab.id, e)
      }
      return
    }
    // Normal click: open tab
    if (tab?.id) extAPI.openTab(tab.id)
    onactionat?.(nth)
  }

  function handleTabButtonEnter() {
    if (editMode) {
      if (tab?.id !== undefined) {
        onselect?.(tab.id, new MouseEvent('click'))
      }
      return
    }
    if (tab?.id) extAPI.openTab(tab.id)
    onactionat?.(nth)
  }

  function handleCheckboxChange() {
    if (tab?.id !== undefined) {
      onselect?.(tab.id, new MouseEvent('click'))
    }
  }
  function togglePinTab() {
    if (tab?.id) extAPI.updateTabs(tab.id, { pinned: !tab.pinned })
    onactionat?.(nth)
  }
  function toggleMuteTab() {
    if (tab?.id) extAPI.updateTabs(tab.id, { muted: !tab.mutedInfo?.muted })
    onactionat?.(nth)
  }
  function closeTab() {
    if (tab?.id) extAPI.closeTab(tab.id)
    onactionat?.(nth)
  }

  function runIfEnter(e: KeyboardEvent, fn: () => void) {
    if (e.key === 'Enter') {
      e.preventDefault()
      fn()
    } else if (e.key === 'Home') {
      e.preventDefault()
      onfocusset?.(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onfocusset?.(1)
    }
  }
  $effect(() => {
    focusElement(focus)
  })
</script>

<li
  data-tab-id={tab.id}
  class:focus={focus[0] === nth}
  class:focus-main={focus[0] === nth &&
    (focus[1] === 1 || (!editMode && focus[1] === 0))}
  class:current={tab.active}
  class:selected
  class={`chromeGroupColor ${$tabGroups[tab.groupId]?.color || ''}`}
>
  {#if editMode}
    <span class="drag-handle" aria-label={$_('drag-handle-label')}>
      {@html iconDragHandle}
    </span>
  {/if}
  {#if editMode || selected}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="checkbox-area"
      onkeydown={(e: KeyboardEvent) => runIfEnter(e, handleCheckboxChange)}
    >
      <Toggleable
        bind:element={checkboxEl}
        id={`tab-checkbox-${tab.id}`}
        type="checkbox"
        checked={selected}
        onchange={handleCheckboxChange}
        aria-label={$_('select-tab') + ' - ' + tab.title}
      />
    </div>
  {/if}
  <button
    class="tab-button"
    bind:this={buttons[1]}
    tabindex={isFocused(focus, 1) ? 0 : -1}
    onclick={handleTabClick}
    onkeydown={(e) => runIfEnter(e, handleTabButtonEnter)}
    {oncontextmenu}
    aria-pressed={editMode ? selected : undefined}
  >
    <div
      class="favicon"
      class:grouped={$stateStore.preferences?.showGroupTabs &&
        tab.groupId &&
        tab.groupId !== -1}
    >
      {#if tab.favIconUrl}
        <img src={tab.favIconUrl} alt="" />
      {:else}
        <span>{@html HelloTabsIcon}</span>
      {/if}
    </div>
    <div class="text">
      <h1 class="tint--type-ui">
        {#if tab.title_hl}
          {@html tab.title_hl}
        {:else}
          {tab.title}
        {/if}
      </h1>
      <div class="sub">
        {#if $stateStore.preferences?.showContainerTabs && tab.cookieStoreId && tab.cookieStoreId !== 'firefox-default' && $containers[tab.cookieStoreId]}
          <p
            class={`tint--type-ui-small-bold container firefoxContainer ${
              $containers[tab.cookieStoreId].color
            }`}
          >
            <span aria-hidden="true"
              >{@html containerIcons[$containers[tab.cookieStoreId].icon]}</span
            >
            {$containers[tab.cookieStoreId].name}
          </p>
        {/if}
        <p class="tint--type-ui-small">
          {#if tab.url_hl}
            {@html tab.url_hl}
          {:else}
            {tab.url}
          {/if}
        </p>
      </div>
    </div>
  </button>
  <div class="actions">
    {#if tab.audible || tab.mutedInfo?.muted}
      <Button
        bind:element={buttons[2]}
        icon={true}
        onclick={toggleMuteTab}
        onkeydown={(e) => runIfEnter(e, toggleMuteTab)}
        small={true}
        tabindex={isFocused(focus, 2) ? 0 : -1}
        title={$_('mute-tab-button')}
        variant="ghost"
        >{@html tab.mutedInfo?.muted ? iconAudio : iconAudioOff}</Button
      >
    {/if}
    {#if tab.pinned || focus[0] === nth}
      <Button
        bind:element={buttons[3]}
        icon={true}
        onclick={togglePinTab}
        onkeydown={(e) => runIfEnter(e, togglePinTab)}
        small={true}
        tabindex={isFocused(focus, 3) ? 0 : -1}
        title={$_('pin-tab-button')}
        toggled={tab.pinned}
        variant="ghost">{@html tab.pinned ? iconPinFill : iconPin}</Button
      >
    {/if}
    <Button
      bind:element={buttons[4]}
      icon={true}
      onclick={closeTab}
      onkeydown={(e) => runIfEnter(e, closeTab)}
      small={true}
      tabindex={isFocused(focus, 4) ? 0 : -1}
      title={$_('close-tab-button')}
      variant="ghost"
      >{@html iconClose}
    </Button>
  </div>
</li>

<style lang="sass">
  li, .tab-button
    display: flex
    align-items: center

  .current
    background: var(--tint-input-bg)
    .favicon
      background: var(--tint-bg)

  .tab-button
    flex-grow: 1
    border: none
    border-radius: 0
    background: none
    padding: tint.$size-12
    text-transform: none
    text-align: start
    min-width: 0
    gap: tint.$size-16
    margin-inline-end: tint.$size-8
    border-top-right-radius: tint.$size-8
    border-bottom-right-radius: tint.$size-8
    position: relative
    .text
      flex-grow: 1
      min-width: 0
    &:focus-visible
      outline: 2px solid var(--tint-action-primary)
      outline-offset: -2px
      border-radius: tint.$size-8
    &:active
      background: var(--tint-action-secondary-active)

  h1, p
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap

  p
    color: var(--tint-text-secondary)
    margin-block-start: tint.$size-2

  .favicon.grouped
    outline: 2px solid var(--special-color-bg)
  .focus-main .favicon.grouped
    box-shadow: 0 0 0 4px #fff, inset 0 0 0 4px #fff
    @media (prefers-color-scheme: dark)
      box-shadow: 0 0 0 4px #00000066, inset 0 0 0 2px #00000066

  .favicon
    padding: tint.$size-12
    background: var(--tint-input-bg)
    line-height: 0
    border-radius: 50%
    > img, > span > :global(svg)
      width: tint.$size-16
      height: tint.$size-16
      fill: currentColor
    > span
      color: var(--tint-text-secondary)

  :global(.highlight)
    background: rgba(0,0,0, 0.05)
    box-shadow: inset 0 0 0 1px rgba(0,0,0, 0.1)

  .actions
    padding-inline-end: tint.$size-8
    flex-shrink: 0
    > :global(button:not(.primary))
      color: var(--tint-text)

  .focus
    background: var(--tint-input-bg)

  .focus-main
    background: var(--tint-action-primary)
    color: var(--tint-bg)
    .favicon
      background: #FFF
      @media (prefers-color-scheme: dark)
        background: #FFFFFF99
        span
          color: #FFF
    .tab-button, .tab-button p
      color: var(--tint-action-text)
    .actions > :global(button)
      color: var(--tint-action-text)
    .actions > :global(button:focus-visible)
      outline-color: var(--tint-action-text)
    .checkbox-area :global(input:focus-visible)
      outline: 2px solid var(--tint-action-text)
      outline-offset: 2px


  .sub
    display: flex
    flex-direction: row
    // every item after the last one gets a utf-8 dot after it
    > :global(p:not(:first-child))::before
      content: '—'
      margin-inline: tint.$size-4

  .container
    display: flex
    align-items: center
    gap: tint.$size-4
    flex-shrink: 0
    color: var(--special-color)
    span
      line-height: 0
    :global(> span > svg)
      height: tint.$size-12
      width: tint.$size-12

  .selected
    background: color-mix(in srgb, var(--tint-action-primary) 12%, transparent)
  .selected.focus-main
    background: color-mix(in srgb, var(--tint-action-primary) 24%, transparent)
    color: var(--tint-text)
    .favicon
      background: var(--tint-input-bg)
    .tab-button, .tab-button p
      color: var(--tint-text)
    .tab-button p
      color: var(--tint-text-secondary)
    .actions > :global(button)
      color: var(--tint-text)

  .focus-main .checkbox-area :global(input)
    border-color: var(--tint-action-text)
  .focus-main .checkbox-area :global(input:checked)
    background-color: var(--tint-action-text)
    color: var(--tint-action-primary)

  .drag-handle
    display: flex
    align-items: center
    padding-inline-start: tint.$size-8
    color: var(--tint-text-secondary)
    line-height: 0
    cursor: grab
    user-select: none
    &:active
      cursor: grabbing
    :global(svg)
      width: 14px
      height: 14px

  .checkbox-area
    display: flex
    align-items: center
    padding-inline-start: tint.$size-12
    flex-shrink: 0
</style>

<script lang="ts">
  import { _ } from 'svelte-i18n'
  import Button from 'tint/components/Button.svelte'
  import HelloTabsIcon from '@src/assets/icon.svg?raw'
  import iconAudio from 'tint/icons/20-volume-off.svg?raw'
  import iconAudioOff from 'tint/icons/20-volume-up.svg?raw'
  import iconPin from 'tint/icons/20-push-pin.svg?raw'
  import iconPinFill from 'tint/icons/20-push-pin-fill.svg?raw'
  import iconClose from 'tint/icons/20-close.svg?raw'
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
    onactionat = undefined,
    onfocusset = undefined,
    oncontextmenu = undefined,
    focusLeft = $bindable(undefined),
    focusRight = $bindable(undefined),
  }: Props = $props()

  let buttons: (HTMLButtonElement | undefined)[] = $state([
    undefined,
    undefined,
    undefined,
    undefined,
  ])

  onMount(() => {
    focusElement(focus)
  })

  const focusLeftFn = () => {
    if (!claimFocus) {
      return
    } else if (document.dir == 'rtl') moveFocusRight()
    else moveFocusLeft()
  }
  const focusRightFn = () => {
    if (!claimFocus) {
      return
    } else if (document.dir == 'rtl') moveFocusLeft()
    else moveFocusRight()
  }

  focusLeft = focusLeftFn
  focusRight = focusRightFn

  function moveFocusLeft() {
    // find the next focusable element in buttons element.
    // if we reach the end of the list, do nothing
    let current = focus[1]
    while (current > 0) {
      current--
      if (buttons[current]) {
        focus = [focus[0], current]
        return
      }
    }
  }
  function moveFocusRight() {
    // find the next focusable element in buttons element.
    // if we reach the end of the list, do nothing
    let current = focus[1]
    while (current < buttons.length - 1) {
      current++
      if (buttons[current]) {
        focus = [focus[0], current]
        return
      }
    }
  }

  function focusElement(f: [number, number]) {
    // Skip if this tab is not focused or we don't want to claim focus
    if (f[0] !== nth) {
      return
    }
    buttons[0]?.scrollIntoView({
      behavior: claimFocus ? 'smooth' : 'instant',
      block: claimFocus ? 'nearest' : 'center',
    })
    if (!claimFocus) {
      return
    }
    // If the focus is 0, focus the first button
    if (f[1] === 0) {
      buttons[0]?.focus()
      return
    }
    // otherwise we try to select the button at the given index,
    // if it does not exist we go up until we find one that does
    for (let i = f[1]; i < buttons.length; i++) {
      if (buttons[i]) {
        buttons[i]?.focus()
        return
      }
    }
    // otherwise, focus the last button
    buttons[buttons.length - 1]?.focus()
  }

  function isFocused(f: [number, number], i: number) {
    return f[0] === nth && f[1] === i
  }

  function openTab() {
    tab?.id && extAPI.openTab(tab.id)
    onactionat?.(nth)
  }
  function togglePinTab() {
    tab?.id && extAPI.updateTabs(tab.id, { pinned: !tab.pinned })
    onactionat?.(nth)
  }
  function toggleMuteTab() {
    tab?.id &&
      extAPI.updateTabs(tab.id, {
        muted: !tab.mutedInfo?.muted ? true : false,
      })
    onactionat?.(nth)
  }
  function closeTab() {
    tab?.id && extAPI.closeTab(tab.id)
    onactionat?.(nth)
  }

  function runIfEnter<T extends (...args: any[]) => any>(
    e: KeyboardEvent,
    fn: T,
    ...args: Parameters<T>
  ) {
    if (e.key === 'Enter') {
      e.preventDefault()
      fn(...args)
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
  class:focus={isFocused(focus, 0)}
  class:current={tab.active}
  class={`chromeGroupColor ${$tabGroups[tab.groupId]?.color || ''}`}
>
  <button
    class="tab-button"
    bind:this={buttons[0]}
    tabindex={isFocused(focus, 0) ? 0 : -1}
    onclick={openTab}
    onkeydown={(e) => runIfEnter(e, openTab)}
    oncontextmenu={oncontextmenu}
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
        bind:element={buttons[1]}
        icon={true}
        onclick={toggleMuteTab}
        onkeydown={(e) => runIfEnter(e, toggleMuteTab)}
        small={true}
        tabindex={isFocused(focus, 1) ? 0 : -1}
        title={$_('mute-tab-button')}
        variant="ghost"
        >{@html tab.mutedInfo?.muted ? iconAudio : iconAudioOff}</Button
      >
    {/if}
    {#if tab.pinned || focus[0] === nth || true}
      <Button
        bind:element={buttons[2]}
        icon={true}
        onclick={togglePinTab}
        onkeydown={(e) => runIfEnter(e, togglePinTab)}
        small={true}
        tabindex={isFocused(focus, 2) ? 0 : -1}
        title={$_('pin-tab-button')}
        toggled={tab.pinned}
        variant="ghost">{@html tab.pinned ? iconPinFill : iconPin}</Button
      >
    {/if}
    <Button
      bind:element={buttons[3]}
      icon={true}
      onclick={closeTab}
      onkeydown={(e) => runIfEnter(e, closeTab)}
      small={true}
      tabindex={isFocused(focus, 3) ? 0 : -1}
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
    &:focus
      outline: none
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
  .focus .favicon.grouped
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
</style>

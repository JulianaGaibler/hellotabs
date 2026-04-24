<script lang="ts">
  import { _ } from 'svelte-i18n'
  import Button from 'tint/components/Button.svelte'
  import BackIcon from 'tint/icons/20-chevron-left.svg?raw'
  import {
    hasContainerSupport,
    hasTabGroupSupport,
  } from '@src/utils/extension-api'
  import Shortcut from '@src/components/preferences/Shortcut.svelte'
  import Language from '@src/components/preferences/Language.svelte'
  import ShowTabGroups from '@src/components/preferences/ShowTabGroups.svelte'
  import ShowTabContainers from '@src/components/preferences/ShowTabContainers.svelte'
  import Theme from '@src/components/preferences/Theme.svelte'
  import ShowOverview from '@src/components/preferences/ShowOverview.svelte'
  import SearchAllWindows from '@src/components/preferences/SearchAllWindows.svelte'
  import { tooltip } from 'tint/actions'
  import GLogo from '@src/assets/g-logo.svg?raw'
  import ShareAndSupport from './components/preferences/ShareAndSupport.svelte'
  const VERSION = __VERSION__

  interface Props {
    ontogglepreferences?: () => void
  }

  let { ontogglepreferences = undefined }: Props = $props()
</script>

<header class="tint--tinted">
  <Button
    icon={true}
    variant="ghost"
    tooltip={$_('back-button')}
    onclick={() => ontogglepreferences?.()}>{@html BackIcon}</Button
  >
  <h1 class="tint--type-body-sans">{$_('preferences-header')}</h1>
</header>

<main class="main-area tint--tinted">
  <div class="grid">
    <Shortcut />
    <Language />
    <Theme />
    <ShowOverview />
    <SearchAllWindows />
    {#if hasTabGroupSupport}
      <ShowTabGroups />
    {/if}
    {#if hasContainerSupport}
      <ShowTabContainers />
    {/if}
    <ShareAndSupport />
  </div>
  <p class="credits">
    Made by <a
      href="https://juliana.me/"
      use:tooltip={'Juliana Gaibler'}
      target="_blank"
      rel="noopener">{@html GLogo}</a
    > in Berlin
  </p>
</main>

<footer class="infobar tint--tinted tint--type-ui-small">
  <p>HelloTabs {VERSION}</p>
  <a
    href="https://github.com/JulianaGaibler/hellotabs"
    target="_blank"
    rel="noopener">{$_('source-code')}</a
  >
</footer>

<style lang="sass">
  .grid
    padding-block: tint.$size-24
    padding-inline: tint.$size-64 + tint.$size-4
    display: grid
    grid-template-columns: 4fr 3fr
    gap: tint.$size-24
    :global(p)
      color: var(--tint-text-secondary)
    > :global(.controls)
      display: flex
      flex-direction: column
      justify-content: center
      gap: tint.$size-8
    > :global(.controls.end)
      align-items: flex-end

  footer
    color: var(--tint-text-secondary)
    > a
      text-align: end

  .credits
    padding-block-end: tint.$size-24
    padding-inline: tint.$size-64 + tint.$size-4
    display: flex
    align-items: center
    justify-content: center
    a
      text-decoration: none
      line-height: 0
      margin-inline: tint.$size-2
      &:hover
        color: var(--tint-text-link)
    :global(svg)
      height: tint.$size-24
      width: tint.$size-24
</style>

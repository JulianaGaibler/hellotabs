<script lang="ts">
  import Preferences from '@src/Preferences.svelte'
  import Search from '@src/Search.svelte'

  let showPreferences = $state(false)
</script>

<div id="app" class="tint--type-ui tint--plain">
  {#if showPreferences}
    <Preferences ontogglepreferences={() => (showPreferences = false)} />
  {:else}
    <Search ontogglepreferences={() => (showPreferences = true)} />
  {/if}
</div>

<style lang="sass">
  #app
    max-height: 500px
    display: flex
    flex-direction: column
    background: var(--tint-bg)
    color: var(--tint-text)
    flex-grow: 1
    > :global(header)
      padding-block: var(--tint-size-4)
      padding-inline: var(--tint-size-8)
      gap: var(--tint-size-12)
      align-items: center
      display: flex
      background: var(--tint-bg)
      border-block-end: 1px solid var(--tint-input-bg)
      flex-shrink: 0
    > :global(.main-area)
      flex-grow: 1
      overflow-x: auto
      background: var(--tint-bg)
    > :global(.infobar)
      padding-block: var(--tint-size-4)
      padding-inline: var(--tint-size-8)
      gap: var(--tint-size-12)
      align-items: center
      display: flex
      background: var(--tint-input-bg)
      flex-shrink: 0
    > :global(.infobar > *)
      flex-grow: 1
</style>

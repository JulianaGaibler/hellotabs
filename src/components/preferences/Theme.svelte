<script lang="ts">
  import stateStore from '@src/utils/state-store'
  import { _ } from 'svelte-i18n'
  import Select from 'tint/components/Select.svelte'

  let items = $derived([
    {
      value: 'system',
      label: $_('theme-system'),
    },
    {
      value: 'light',
      label: $_('theme-light'),
    },
    {
      value: 'dark',
      label: $_('theme-dark'),
    },
  ])

  function handleChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    if (!items.map((item) => item.value).includes(value)) return
    stateStore.setPreferences('theme', value as 'system' | 'light' | 'dark')
  }
</script>

<div>
  <h2 class="tint--type-ui-bold">{$_('preferences-theme-headline')}</h2>
  <p id="locale-description">{$_('preferences-theme-explanation')}</p>
</div>
<div class="controls">
  <Select
    id="input"
    aria-describedby="locale-description"
    {items}
    label={$_('preferences-theme-headline')}
    value={$stateStore.preferences?.theme}
    onchange={handleChange}
  />
</div>

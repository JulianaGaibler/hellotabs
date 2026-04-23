<script lang="ts">
  import stateStore from '@src/utils/state-store'
  import { _ } from 'svelte-i18n'
  import Toggleable from 'tint/components/Toggleable.svelte'

  function handleChange({ checked }: { checked: boolean }) {
    stateStore.setPreferences('showContainerTabs', checked)
  }
</script>

<div>
  <h2 class="tint--type-ui-bold">
    {$_('preferences-show-tab-containers-headline')}
  </h2>
  <p id="overview-description">
    {$_('preferences-show-tab-containers-explanation')}
  </p>
</div>
<div class="controls end">
  <Toggleable
    checked={!!$stateStore.preferences?.showContainerTabs}
    onchange={handleChange}
    aria-describedby="overview-description"
    id="input"
    type="switch"
  />
</div>

<script lang="ts">
  import { _ } from 'svelte-i18n'
  import Button from 'tint/components/Button.svelte'

  function getStoreLink() {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Firefox')) {
      return 'https://addons.mozilla.org/firefox/addon/tabby-fast-tab-switching/'
    } else if (userAgent.includes('Edg')) {
      return 'https://microsoftedge.microsoft.com/addons/detail/tabby-fast-tab-switchin/jhdgfjplonmembfjbknipgbaimaelage'
    } else {
      return 'https://chrome.google.com/webstore/detail/tabby-fast-tab-switching/jgchkdchcccoibbjnknjakpcbjemapkn'
    }
  }

  const SUPPORT_LINK = 'https://juliana.me/projects/hellotabs#support'
  const STORE_LINK = getStoreLink()
</script>

<div>
  <h2 class="tint--type-ui-bold">{$_('preferences-recommend-headline')}</h2>
  <p id="locale-description">{$_('preferences-recommend-explanation')}</p>
</div>
<div class="controls end">
  <Button href={STORE_LINK} external small
    >{$_('preferences-recommend-action')}</Button
  >
</div>

<div>
  <h2 class="tint--type-ui-bold">{$_('preferences-support-headline')}</h2>
  <p id="locale-description">{$_('preferences-support-explanation')}</p>
</div>
<div class="controls end">
  <Button href={SUPPORT_LINK} external small
    >{$_('preferences-support-action')}</Button
  >
</div>

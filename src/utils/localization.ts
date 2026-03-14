import en from '@src/locales/en.yaml'
import {
  addMessages,
  getLocaleFromNavigator,
  init,
  register,
  locale,
} from 'svelte-i18n'

addMessages('en', en)
register('pt-BR', () => import('@src/locales/pt_BR.yaml'))
register('pt-PT', () => import('@src/locales/pt_PT.yaml'))
register('de', () => import('@src/locales/de.yaml'))
register('fr', () => import('@src/locales/fr.yaml'))
register('es', () => import('@src/locales/es.yaml'))
register('es-AR', () => import('@src/locales/es_AR.yaml'))
register('es-MX', () => import('@src/locales/es_MX.yaml'))

function getLocale() {
  const system = getLocaleFromNavigator()
  console.log('system locale:', system)
  if (!system) return 'en'
  // the system locale might return something like 'en-US' or 'de-DE' or 'pt-BR'
  // for german, french, english and spanish we want to return the language code only
  // (unless it's a specific variant like es-AR or es-MX)
  if (system.startsWith('de')) return 'de'
  if (system.startsWith('en')) return 'en'
  if (system.startsWith('fr')) return 'fr'
  if (system === 'es-AR') return 'es-AR'
  if (system === 'es-MX') return 'es-MX'
  if (system.startsWith('es')) return 'es'
  return system
}

init({
  fallbackLocale: 'en',
  initialLocale: getLocale(),
})
locale.set(getLocale())

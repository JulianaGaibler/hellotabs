// Initialize media query listener
const query = window.matchMedia('(prefers-color-scheme: dark)')

// Notify background script of the current theme
function notifyThemeChange(): void {
  const darkMode = query.matches
  chrome.runtime.sendMessage({ type: 'themeChange', darkMode })
}

// Listen for theme changes
// Does not actually seem to work on Chrome right now lol
query.addEventListener('change', notifyThemeChange)

// Notify on initialization
notifyThemeChange()

const thisBrowser = (() => {
  if (typeof browser !== 'undefined') return browser
  else if (typeof chrome !== 'undefined') return chrome
  else return undefined
})()

let creating: Promise<void> | null = null
async function ensureOffscreen(): Promise<void> {
  const isOffscreen = await chrome.offscreen.hasDocument()
  if (isOffscreen) {
    return
  }

  if (creating === null) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['MATCH_MEDIA' as any],
      justification: 'Access window object for light/dark theme media query',
    })
  }
  await creating
  creating = null
}

// Update the icon based on the received theme
function updateIcon(darkMode: boolean): void {
  const icons = darkMode
    ? {
        16: '/icons/hellotabs_icon_eye_dark_16.png',
        48: '/icons/hellotabs_icon_eye_dark_48.png',
        128: '/icons/hellotabs_icon_eye_dark_128.png',
      }
    : {
        16: '/icons/hellotabs_icon_eye_light_16.png',
        48: '/icons/hellotabs_icon_eye_light_48.png',
        128: '/icons/hellotabs_icon_eye_light_128.png',
      }

  chrome.action.setIcon({ path: icons })
}

// Listen for messages from the offscreen document
chrome.runtime.onMessage.addListener((message) => {
  console.log('Received message', message)
  if (message.type === 'themeChange') {
    updateIcon(message.darkMode)
  }
})

// Ensure the offscreen document exists on initialization
ensureOffscreen()

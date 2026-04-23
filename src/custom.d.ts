declare module '*.yaml' {
  const value: Record<string, string | Record<string, string>>
  export default value
}

declare module '*?raw' {
  const value: string
  export default value
}

declare module '*.sass' {
  const value: string
  export default value
}

declare const __VERSION__: string
declare const __FIREFOX__: boolean

interface Window {
  chrome?: typeof chrome
  browser?: typeof browser
}

declare module 'virtual:available-locales' {
  export const availableLocales: string[]
}

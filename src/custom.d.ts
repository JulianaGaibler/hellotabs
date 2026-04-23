declare module '*.yaml' {
  const value: Record<string, string | Record<string, string>>
  export default value
}

declare module '*?raw' {
  const value: string
  export default value
}

declare const __VERSION__: string
declare const __FIREFOX__: boolean

declare module 'virtual:available-locales' {
  export const availableLocales: string[]
}

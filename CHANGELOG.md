# Changelog

## [Unreleased]

## [2.2.0] - 2026-04-23

### Added

- Separate builds for Firefox and Chrome
- Tab editing and reordering
- GitHub Actions CI and automatic releases

### Changed

- Renamed to HelloTabs
- Updated all dependencies (including TypeScript 6, Svelte 5.55, Vite 8)
- Upgraded to latest tint version
- Updated project URLs and links

### Fixed

- Fixed all TypeScript type errors (cross-browser types, tint component types)
- Fixed all ESLint warnings (replaced `any` types, unused variables, short-circuit expressions)
- Fixed selected+focused tab text color in edit mode

## [2.0.2] - 2025-01-14

### Changed

- Moved from background script to service worker (for Chrome)

### Fixed

- Fixed broken support link for shortcuts
- Removed unused icons and made dark-mode icon lighter

## [2.0.1] - 2025-01-11

### Changed

- Major rewrite (Tabby 2)

## [1.1.0] - 2020-08-01

### Added

- Theme color, shortcuts, and more tab actions
- Improved accessibility mode

### Fixed

- Fixed bug where Chrome popup would not resize properly
- Fixed bug where user could not tab to settings button
- Fixed dark icon on dark background issue

## [1.0.0] - 2020-06-09

- Initial release

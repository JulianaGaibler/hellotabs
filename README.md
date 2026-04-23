## Introduction

HelloTabs is a browser extension to help you switch between tabs in a breeze.

## Setup and Configuration

Since this is an extension that uses extension browser APIs a lot of features won't work in dev-mode.

To install dependencies, run and build HelloTabs, you need node and npm. When you have done this, you can navigate into the directory and install the dependencies.

```bash
cd path/to/hellotabs
npm install
```

You can run the extension in your browser as a website by calling `npm run dev`.

If you want to build the extension you can run `npm run build`, or `npm run build:watch` to rebuild the extension on file changes.
After that, the unpacked extension will be in the `dist/` directory, ready to be tested in your browser.

## Contribution and Commits

### Language contributions

If you want to help with translating HelloTabs into more languages, follow these steps:

1. Clone the repository
2. Copy the [English language file](https://github.com/JulianaGaibler/hellotabs/blob/master/src/locales/en.yaml).
3. Rename the file to match the locale you are translating to (mind the note below).
4. Translate the strings (If they don't start with a letter you have to wrap them in `"` quotes).
5. Add the name of the language (in english) to the [English language file](/JulianaGaibler/hellotabs/blob/master/src/locales/en.yaml).
6. Make a pull request

You can also reach out on [Mastodon](https://mastodon.social/@JulianaGaibler) or [Bluesky](https://bsky.app/profile/juliana.me) if you have trouble with that or questions.

**Note:** The Chrome Web Store has a list of accepted [locale strings](https://developer.chrome.com/webstore/i18n#localeTable). If the language you translated to matches one of these, please use the corresponding locale code.

### Code contributions

Contributions such as pull requests, reporting bugs and suggesting enhancements are always welcome!

We're using [gitmoji](https://gitmoji.carloscuesta.me/) for all commits.

### Contributers

| Name                                                 |          Type          | Info                   |
| :--------------------------------------------------- | :--------------------: | :--------------------- |
| <a href="//github.com/RodrigoSaint">RodrigoSaint</a> | :globe_with_meridians: | Portuguese translation |

# Wrike Rich-Text Link Copier

A tiny Chrome extension that turns copied [Wrike](https://www.wrike.com/) task/project
URLs into **human-friendly rich-text links**. Instead of pasting a raw URL like
`https://app-eu.wrike.com/open.htm?id=1234567890` into Slack, docs, or email, you paste a
clickable link whose label is the task's title (e.g. **Fix login redirect bug**).

## Why

Wrike URLs are opaque IDs. When you share one in Slack it shows up as a long, meaningless
string. This extension intercepts the copy action while you're on a Wrike page and rewrites
the clipboard so that:

- **Rich-text targets** (Slack, Gmail, Google Docs, Notion, etc.) get a proper hyperlink
  labelled with the task title.
- **Plain-text targets** (a code editor, a terminal) still get the raw URL, so nothing breaks.

## How it works

The extension injects a single content script (`content.js`) into every `*.wrike.com` page.
Running in the page's `MAIN` world at `document_start`, it patches the clipboard write paths
**before** Wrike's own code runs, so both the built-in "Copy link" buttons and manual copies
are covered. It hooks three paths:

1. `navigator.clipboard.writeText` — the modern text write API.
2. `navigator.clipboard.write` — the modern generic (multi-format) write API.
3. The legacy `copy` DOM event — fallback for `document.execCommand('copy')` and manual copies.

When any of these fires with a string that is a valid `*.wrike.com` URL, the script:

1. Derives a clean title from `document.title` (stripping the trailing ` - Wrike`).
2. Writes a `ClipboardItem` containing both `text/html` (`<a href="URL">Title</a>`) and
   `text/plain` (the raw URL).
3. Shows a small "📋 Copied Rich Link!" toast in the top-right corner as confirmation.

Non-Wrike URLs and non-URL text pass through untouched.

## Install (unpacked / developer mode)

1. Open `chrome://extensions` in Chrome (or any Chromium browser — Edge, Brave, Arc).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this folder.
4. Open any Wrike task and use its **Copy link** button, or copy a Wrike URL manually.
   You should see the confirmation toast, and pasting into Slack yields a titled link.

To update after pulling new changes, return to `chrome://extensions` and click the reload
icon on the extension's card.

## Usage

Just copy a Wrike link the way you normally would while on a Wrike tab:

- Click the **Copy link** control on a task/project, **or**
- Select a Wrike URL on the page and press <kbd>Cmd/Ctrl</kbd>+<kbd>C</kbd>.

Then paste (<kbd>Cmd/Ctrl</kbd>+<kbd>V</kbd>) into your destination. Rich-text apps show the
titled link; plain-text apps show the URL.

## Known limitations

- **Title source is the page title.** The label comes from `document.title`, which reflects
  the task currently open in the tab. Copying a link to a *different* task (e.g. from a list
  view where the URL differs from the open task) may label it with the wrong title.
- **Only same-tab Wrike pages.** The script only runs on `*.wrike.com`; copying a Wrike URL
  from another site will not be enhanced.
- **Rich paste depends on the destination.** Apps that accept only plain text will show the
  raw URL — this is intentional and correct.
- **No icons.** The extension ships without toolbar icons (it has no popup/action UI); Chrome
  shows a default placeholder. This is cosmetic only.

## Project layout

```
wrike-rich-copier/
├── manifest.json   # MV3 manifest — declares the content script and match pattern
├── content.js      # All logic: clipboard interception + rich-link rewriting
├── README.md       # This file
├── AGENTS.md       # Guide for AI agents maintaining this repo
├── CLAUDE.md       # Pointer to AGENTS.md for Claude Code
├── CHANGELOG.md    # Version history
├── LICENSE         # MIT
└── .gitignore
```

## Contributing / maintenance

This project is intentionally small and dependency-free — there is no build step. Edit
`content.js` directly and reload the unpacked extension to test. See [AGENTS.md](AGENTS.md)
for architecture details and testing guidance aimed at AI coding agents.

## License

[MIT](LICENSE)

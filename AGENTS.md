# AGENTS.md — maintainer guide for AI agents

This file orients an AI coding agent (Claude Code, etc.) working on this repo so it can make
changes safely **without** the human owner having to hand-hold or apply manual edits. Read
this before editing.

## What this project is

A single-purpose **Chrome Manifest V3** extension that rewrites copied Wrike URLs into
rich-text hyperlinks (`<a href="URL">Task Title</a>`) so they paste nicely into Slack, docs,
and email. There is **no build system, no dependencies, no framework** — it is two source
files plus docs. Do not introduce a bundler, npm packages, or a build step unless the owner
explicitly asks; keeping it zero-dependency and directly loadable as an unpacked extension is
a core design goal.

## Files that matter

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest. Declares one content script matching `https://*.wrike.com/*`, injected in the `MAIN` world at `document_start`. |
| `content.js`    | 100% of the logic. An IIFE that patches clipboard APIs and rewrites Wrike URLs. |

Everything else (`README.md`, `CHANGELOG.md`, `LICENSE`, `.gitignore`, this file) is docs/repo
hygiene.

## Architecture of `content.js`

The whole script is one IIFE guarded by `window.__wrikeRichLinkInterceptorLoaded` to prevent
double-injection. Key pieces, in order:

1. **Stashing originals** — `originalWriteText` / `originalWrite` capture the native
   `navigator.clipboard` methods *before* patching, so rewriting the clipboard can call the
   real API without triggering infinite recursion. **Always write via these stashed
   references, never the patched ones.**
2. **`getCleanWrikeTitle()`** — reads the title from the work-item header
   (`getTitleFromHeader()`) and only falls back to `document.title` (stripped of the trailing
   ` - Wrike`) when no header is present. The header is authoritative because opening a task
   from a list view in a modal or side panel leaves `document.title` pointing at the list, not
   the task. `getTitleFromHeader()` prefers the header tied to the last-clicked
   `permalink-button` (tracked via a capture-phase `click` listener) so that with multiple
   panels open the copied link matches the item the user acted on.
3. **`escapeHtml()` / `buildAnchorHtml()`** — escape all interpolated values before building
   the anchor. **Any code path that emits `text/html` MUST go through `buildAnchorHtml()`.**
   Wrike titles contain `&`, `<`, `>`, and quotes; unescaped interpolation produces corrupt
   markup and is the single most likely regression in this codebase.
4. **`isWrikeUrl()`** — parses with `new URL()` and checks `hostname.endsWith('wrike.com')`.
5. **`writeRichLink()`** — builds a `ClipboardItem` with both `text/html` and `text/plain`
   and writes via the stashed original; then calls `showToast()`.
6. **`showToast()`** — transient confirmation UI. Guards on `document.body` because the script
   can run before `<body>` exists.
7. **Three interception points** — `writeText` override, `write` override, and a capture-phase
   `copy` event listener (legacy fallback). Non-Wrike input falls through to original behavior.

## Why `MAIN` world + `document_start` (do not change casually)

- **`MAIN` world**: the script must patch the *page's own* `navigator.clipboard`, because
  Wrike's "Copy link" buttons run in the page context. An isolated-world patch would not be
  visible to Wrike's code. Consequence: `chrome.*` extension APIs are **not** available here —
  do not add code that depends on them without moving logic to a separate isolated-world or
  background script.
- **`document_start`**: patch clipboard methods before Wrike captures its own references.

## Invariants / do-not-break list

- Zero dependencies, no build step, loadable as unpacked directly from this folder.
- Plain-text clipboard content stays the raw URL; only the `text/html` flavor is enriched.
- Non-Wrike URLs and non-strings pass through unmodified on every interception path.
- All HTML output is escaped via `buildAnchorHtml()`.
- Never call the patched clipboard methods from within the rewrite logic (recursion).
- Keep `manifest.json` valid JSON and `manifest_version: 3`.

## How to test a change (there are no automated tests)

Static checks you can run in this repo:

```bash
node --check content.js                                   # JS syntax
python3 -c "import json; json.load(open('manifest.json'))" # manifest is valid JSON
```

Manual verification in a browser (the real test — always do this for behavior changes):

1. Load the folder via `chrome://extensions` → **Load unpacked** (Developer mode on).
2. Open a Wrike task; note its title.
3. Use Wrike's **Copy link** button → expect the "📋 Copied Rich Link!" toast.
4. Paste into Slack (or any rich-text field) → expect a hyperlink labelled with the task title.
5. Paste into a plain-text editor → expect the raw URL.
6. Try a title containing `&`, `<`, `>`, and quotes → the pasted link label must render those
   characters literally, with no broken/injected markup.
7. Copy a **non-Wrike** URL on the page → expect normal, unmodified copy behavior.

After any change to loaded files, click the reload icon on the extension card in
`chrome://extensions`.

## Common change requests and where they land

- **Change the pasted label format** → `buildAnchorHtml()` and/or `getCleanWrikeTitle()`.
- **Support another host / self-hosted Wrike** → `isWrikeUrl()` and the `matches` array in
  `manifest.json` (keep both in sync).
- **Change/disable the toast** → `showToast()` and its callers.
- **Add toolbar icons or a popup** → add `icons` and/or an `action` block to `manifest.json`
  and ship the asset files.

## Versioning & changelog

- Bump `version` in `manifest.json` for any user-visible change (semver-ish: `MAJOR.MINOR`).
- Add a matching entry at the top of `CHANGELOG.md`.

## Commit conventions

Use concise, conventional-style messages, e.g. `fix: escape HTML in rich link label`,
`feat: support self-hosted Wrike hosts`, `docs: expand README limitations`.

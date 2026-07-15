# CLAUDE.md

This repo's maintainer guidance for AI agents lives in **[AGENTS.md](AGENTS.md)** — read it
before making changes. It covers the architecture, invariants (escape all HTML, no build
step, `MAIN`-world reasoning), how to test, and where common change requests land.

Quick facts:

- Chrome MV3 extension, zero dependencies, no build step. Load unpacked from this folder.
- All logic is in `content.js`; `manifest.json` just declares the content script.
- Sanity checks: `node --check content.js` and validate `manifest.json` is valid JSON.
- Behavior changes require manual verification in Chrome (see AGENTS.md → "How to test").

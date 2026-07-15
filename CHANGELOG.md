# Changelog

All notable changes to this project are documented here. This project uses simple
`MAJOR.MINOR` versioning, kept in sync with the `version` field in `manifest.json`.

## [1.0] — 2026-07-15

### Added
- Initial release: intercepts copied Wrike URLs on `*.wrike.com` pages and rewrites the
  clipboard to a rich-text hyperlink labelled with the task/project title, while keeping the
  raw URL as the plain-text flavor.
- Three interception paths: `navigator.clipboard.writeText`, `navigator.clipboard.write`, and
  the legacy `copy` DOM event.
- Confirmation toast ("📋 Copied Rich Link!").
- Repository documentation: `README.md`, `AGENTS.md`, `CLAUDE.md`, `LICENSE`, `.gitignore`.

### Fixed
- HTML-escape the title and URL when building the anchor so Wrike titles containing `&`, `<`,
  `>`, or quotes no longer produce corrupt/injected markup. Empty titles now fall back to the
  URL as the label.
- Guard the confirmation toast against a missing `document.body` (the script runs at
  `document_start`).

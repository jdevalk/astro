---
'astro': patch
---

Fixes CSS from `client:only` islands leaking to unrelated pages when Rollup merges unrelated modules into the same output chunk.

When building for production, the CSS association logic for `client:only` components was walking **all** modules in a chunk to find which pages should receive the chunk's CSS. This incorrectly attributed CSS to pages reached through modules that have no CSS dependency — for example, shared utility functions that happened to be in the same chunk as a CSS-importing component.

The fix adds a `moduleImportsCss()` filter that skips modules which don't directly import CSS, aligning the `client:only` path with the existing general CSS path which already has this safeguard.

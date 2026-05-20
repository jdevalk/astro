---
'@astrojs/cloudflare': patch
---

Fixes SSR dependency optimization in dev mode to properly discover frontmatter imports during Vite's dep scan phase.

The `astro-frontmatter-scan` esbuild plugin now sets `resolveDir` when returning extracted frontmatter content, allowing esbuild to resolve imports like `import { z } from 'zod'` during the initial dependency scan. Previously, the missing `resolveDir` caused all frontmatter imports to silently fail to resolve, forcing Vite to discover them at runtime and triggering cascading "program reload" cycles.

Also adds the five `astro/virtual-modules/transitions-*.js` entries to the SSR `optimizeDeps.include` list, preventing runtime discovery of transition modules when using `astro:transitions`.

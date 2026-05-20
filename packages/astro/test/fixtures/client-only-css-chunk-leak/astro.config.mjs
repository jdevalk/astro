import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Force StyledPanel (which imports CSS) and formatLabel (a pure
          // utility shared by both islands) into the same output chunk.
          // This simulates what Rollup's default heuristics do in large apps.
          manualChunks(id) {
            if (id.includes('StyledPanel') || id.includes('formatLabel')) {
              return 'shared-utils';
            }
          },
        },
      },
    },
  },
});

import { defineConfig } from 'vite';
import { join } from 'path';

export default defineConfig({
  root: 'apps/testApp',
  resolve: {
    alias: {
      '@lib': join(process.cwd(), 'lib'),
    },
  },
});

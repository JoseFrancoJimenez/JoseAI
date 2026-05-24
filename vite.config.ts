import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'apps/testApp',
  resolve: {
    alias: {
      '@lib': resolve(__dirname, 'lib'),
    },
  },
});

import { defineConfig } from 'vite';
import { join, extname } from 'path';
import { createReadStream, existsSync } from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';

const LIB_DIR = join(process.cwd(), 'lib');

const MIME: Record<string, string> = {
  '.geojson': 'application/geo+json',
  '.json':    'application/json',
};

export default defineConfig({
  root: 'apps/testApp',
  resolve: {
    alias: {
      '@lib': LIB_DIR,
    },
  },
  plugins: [{
    name: 'serve-lib',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/lib/')) return next();
        const filePath = join(process.cwd(), req.url);
        if (!existsSync(filePath)) return next();
        res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
        createReadStream(filePath).pipe(res);
      });
    },
  }],
});

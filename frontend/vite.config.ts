import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Lightweight local dev server plugin to execute serverless API handlers
 * during `npm run dev` without requiring a separate backend or vercel dev CLI.
 */
function localApiProxyPlugin(): Plugin {
  return {
    name: 'local-api-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const pathname = req.url.split('?')[0];
        try {
          if (pathname === '/api/overview') {
            const { default: handler } = await import('./api/overview');
            return await handler(req, res);
          }
          if (pathname === '/api/workflows') {
            const { default: handler } = await import('./api/workflows');
            return await handler(req, res);
          }
          if (pathname === '/api/shows') {
            const { default: handler } = await import('./api/shows');
            return await handler(req, res);
          }
          next();
        } catch (err: unknown) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          const message = err instanceof Error ? err.message : 'Unknown local server error';
          res.end(JSON.stringify({ error: 'Local serverless proxy execution error', message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApiProxyPlugin()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});

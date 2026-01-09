import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: false,
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        // Ensure SPA routing works in preview
        strictPort: false,
      },
      plugins: [
        react(),
        // Custom plugin to handle SPA routing (Vite doesn't have historyApiFallback like webpack)
        {
          name: 'spa-fallback',
          // Handle dev server
          configureServer(server) {
            return () => {
              server.middlewares.use((req, res, next) => {
                const url = req.url || '';
                
                // Skip static assets, API routes, and Vite internal routes
                if (
                  url.includes('.') || // Has file extension (e.g., .js, .css, .png)
                  url.startsWith('/api/') ||
                  url.startsWith('/_') || // Vite internal routes
                  url.startsWith('/node_modules/') ||
                  url.startsWith('/@') || // Vite HMR
                  url.startsWith('/src/') ||
                  url === '/favicon.ico'
                ) {
                  return next();
                }
                
                // For all other routes (SPA routes), serve index.html
                // This allows React Router to handle the routing
                if (url !== '/' && !url.startsWith('/assets/')) {
                  req.url = '/index.html';
                }
                
                next();
              });
            };
          },
          // Handle preview server (for serving dist folder)
          configurePreviewServer(server) {
            return () => {
              server.middlewares.use((req, res, next) => {
                const url = req.url || '';
                
                // Skip static assets and API routes
                if (
                  url.includes('.') || // Has file extension
                  url.startsWith('/api/') ||
                  url.startsWith('/assets/') ||
                  url === '/favicon.ico'
                ) {
                  return next();
                }
                
                // For all SPA routes, serve index.html
                if (url !== '/') {
                  req.url = '/index.html';
                }
                
                next();
              });
            };
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
    };
});

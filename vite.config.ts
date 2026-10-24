import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { createRemoteHandler, memoryStore } from './api/remote';

/**
 * /api/remote в `vite dev` и `vite preview`: тот же обработчик, что и функция Vercel,
 * с хранилищем в памяти. С `--host` телефон в той же Wi-Fi-сети подключается к ноутбуку напрямую.
 */
function remoteRelay(): Plugin {
  const handle = createRemoteHandler(memoryStore());
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/remote')) return next();
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const request = new Request(new URL(req.url!, 'http://localhost'), {
        method: req.method,
        body: hasBody ? Buffer.concat(chunks) : undefined,
      });
      handle(request)
        .then(async (response) => {
          res.statusCode = response.status;
          response.headers.forEach((value, name) => res.setHeader(name, value));
          res.end(await response.text());
        })
        .catch(next);
    });
  };
  return {
    name: 'footurex-remote-relay',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

// base: './' — сборку можно открыть с любого пути (статический хостинг, флешка + `npm run preview`).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), remoteRelay()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber'],
          charts: ['recharts'],
          motion: ['gsap', 'motion'],
        },
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});

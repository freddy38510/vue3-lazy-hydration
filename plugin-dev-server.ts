import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import type TRender from './demo/entry-server';

async function ssrMiddleware(
  vite: ViteDevServer,
  req: Connect.IncomingMessage,
  res: ServerResponse<IncomingMessage>
) {
  const template = await vite.transformIndexHtml(
    req.url as string,
    fs.readFileSync(`${__dirname}/index.html`, 'utf8'),
    req.originalUrl
  );

  const render = (await vite.ssrLoadModule('/demo/entry-server.ts'))
    .default as typeof TRender;

  const { appHtml, css } = await render(req.originalUrl as string, vite);

  res.statusCode = 200;

  res.setHeader('content-type', 'text/html');

  res.end(
    template
      .replace('<!--dev-ssr-css-->', css)
      .replace('<!--app-html-->', appHtml)
  );
}

export default function devSSRPlugin(): Plugin {
  return {
    name: 'dev-ssr',
    configureServer(vite) {
      const { logger } = vite.config;

      return () =>
        vite.middlewares.use((req, res, next) => {
          ssrMiddleware(vite, req, res).catch((e: Error) => {
            vite.ssrFixStacktrace(e);

            logger.error(e.stack || e.message);

            next(e);
          });
        });
    },
  };
}

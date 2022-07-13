import fs from 'node:fs';

const devSSRPlugin = () => ({
  name: 'dev-ssr',
  configureServer(vite) {
    const { logger } = vite.config;

    return () =>
      vite.middlewares.use(async (req, res, next) => {
        try {
          const template = await vite.transformIndexHtml(
            req.url,
            fs.readFileSync(`${__dirname}/index.html`, 'utf8'),
            req.originalUrl
          );

          const { default: render } = await vite.ssrLoadModule(
            '/demo/entry-server.js'
          );

          const { appHtml, css } = await render(req.originalUrl, vite);

          res.statusCode = 200;

          res.setHeader('content-type', 'text/html');

          res.end(
            template
              .replace('<!--dev-ssr-css-->', css)
              .replace('<!--app-html-->', appHtml)
          );
        } catch (e) {
          vite.ssrFixStacktrace(e);

          logger.error(e.stack || e.message);

          next(e);
        }
      });
  },
});

export default devSSRPlugin;

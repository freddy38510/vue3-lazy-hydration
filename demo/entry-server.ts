import path from 'node:path';
import type { ModuleNode, ViteDevServer } from 'vite';
import { renderToString, type SSRContext } from 'vue/server-renderer';
import { collectCss } from './collect-css-ssr';
import createApp from './main';

export default async function render(
  url: string,
  { moduleGraph }: ViteDevServer
) {
  const { app, router } = createApp();

  // set the router to the desired URL before rendering
  // eslint-disable-next-line no-void
  void router.push(url);
  await router.isReady();

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = {} as SSRContext;
  const appHtml = await renderToString(app, ctx);

  const mods: Set<ModuleNode> = new Set();

  // add main module for direct imported styles
  let mod = moduleGraph.getModuleById(path.resolve('./demo/main.ts'));

  if (mod) {
    mods.add(mod);
  }

  // add modules from rendered Vue components
  (ctx.modules as Set<string>).forEach((componentPath) => {
    mod = moduleGraph.getModuleById(path.resolve(componentPath));

    if (mod) {
      mods.add(mod);
    }
  });

  return { appHtml, css: collectCss(mods) };
}

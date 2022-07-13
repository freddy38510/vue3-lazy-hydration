import path from 'node:path';
import { renderToString } from 'vue/server-renderer';
import { collectCss } from './collect-css-ssr';
import createApp from './main';

export default async function render(url, { moduleGraph }) {
  const { app, router } = createApp();

  // set the router to the desired URL before rendering
  router.push(url);
  await router.isReady();

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = {};
  const appHtml = await renderToString(app, ctx);

  const mods = new Set();

  // add main module for direct imported styles
  mods.add(moduleGraph.getModuleById(path.resolve('./demo/main.js')));

  // add modules from rendered Vue components
  ctx.modules.forEach((componentPath) => {
    mods.add(moduleGraph.getModuleById(path.resolve(componentPath)));
  });

  return { appHtml, css: collectCss(mods) };
}

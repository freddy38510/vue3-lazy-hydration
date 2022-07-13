import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';

const originalWindow = window;

function createApp(isClient, setupFn) {
  const App = {
    setup(props, ctx) {
      return setupFn(isClient, props, ctx);
    },
  };

  return createSSRApp(App);
}

export async function withSetup(setupFn) {
  // make sure window is undefined at server-side
  vi.stubGlobal('window', undefined);

  // render at server-side
  const html = await renderToString(createApp(false, setupFn));

  // restore window for client-side
  vi.stubGlobal('window', originalWindow);

  const container = document.createElement('div');

  container.innerHTML = html;

  document.append(container);

  // client-side app
  const app = createApp(true, setupFn);

  // hydrate
  app.mount(container);

  return { app, container };
}

export const triggerEvent = (type, el) => {
  const event = new Event(type, { bubbles: true });

  el.dispatchEvent(event);
};

import { createSSRApp, h, ref } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { flushPromises } from '@vue/test-utils';

import { withSSRSetup, triggerEvent } from '../../test/utils';

import { useLazyHydration, useHydrateWhenTriggered } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should hydrate when trigger is true', async () => {
  const spyClick = vi.fn();
  const trigger = ref(false);

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenTriggered(result, trigger);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  trigger.value = true;
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should unWatch trigger when component has been unmounted', async () => {
  const show = ref(true);
  const trigger = ref(false);

  let spyHydrate;

  await withSSRSetup((isClient) => {
    const LazyComp = {
      setup() {
        const result = useLazyHydration();

        if (isClient) {
          spyHydrate = vi.spyOn(result, 'hydrate');
        }

        useHydrateWhenTriggered(result, trigger);

        return () => h('button', 'foo');
      },
    };

    return () => h('div', [show.value ? h(LazyComp) : h('div', 'hi')]);
  });

  // trigger onUnmounted hook
  show.value = false;
  await flushPromises();

  // run watch effect
  trigger.value = true;
  await flushPromises();

  // watch effect should have been stopped
  expect(spyHydrate).not.toHaveBeenCalledOnce();
});

it('should throw error when used outside of the setup or lifecycle hook method', async () => {
  const originalWindow = window;
  const handler = vi.fn();
  const err = new Error(
    'useHydrateWhenTriggered must be called from the setup or lifecycle hook methods.'
  );

  let result: ReturnType<typeof useLazyHydration>;

  const LazyComp = {
    setup() {
      result = useLazyHydration();

      return () => h('foo');
    },
  };

  const App = {
    setup() {
      function onClick() {
        useHydrateWhenTriggered(result, () => true);
      }

      return () => [h('button', { onClick }, 'foo'), h(LazyComp)];
    },
  };

  const app = createSSRApp(App);

  // make sure window is undefined at server-side
  vi.stubGlobal('window', undefined);

  // render at server-side
  const html = await renderToString(app);

  // restore window for client-side
  vi.stubGlobal('window', originalWindow);

  const container = document.createElement('div');

  container.innerHTML = html;

  document.append(container);

  app.config.errorHandler = handler;

  // hydrate application
  app.mount(container);

  // trigger error
  triggerEvent('click', container.querySelector('button'));

  expect(handler).toHaveBeenCalled();
  expect(handler.mock.calls[0][0]).toStrictEqual(err);
});

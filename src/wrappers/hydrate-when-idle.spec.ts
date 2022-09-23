import { h, onUpdated } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { ensureMocksReset, requestIdleCallback } from '../../test/dom-mocks';
import { withSSRSetup, triggerEvent } from '../../test/utils';

import { hydrateWhenIdle } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  ensureMocksReset();
});

it('should load the wrapped component just before hydration when browser is idle', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();
  requestIdleCallback.mock();

  const WrappedComp = hydrateWhenIdle({
    setup() {
      onUpdated(spyUpdated);

      return () => h('button', { onClick: spyClick }, 'foo');
    },
  });

  const { container } = await withSSRSetup(() => () => h(WrappedComp));

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  requestIdleCallback.runIdleCallbacks();
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();

  requestIdleCallback.restore();
});

it('should load the wrapped component just before hydration when browser is idle (with function)', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();
  requestIdleCallback.mock();

  const WrappedComp = hydrateWhenIdle(() =>
    Promise.resolve({
      setup() {
        onUpdated(spyUpdated);

        return () => h('button', { onClick: spyClick }, 'foo');
      },
    })
  );

  const { container } = await withSSRSetup(() => () => h(WrappedComp));

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  requestIdleCallback.runIdleCallbacks();
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();

  requestIdleCallback.restore();
});

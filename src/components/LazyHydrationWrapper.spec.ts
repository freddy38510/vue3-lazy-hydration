import { createSSRApp, h, nextTick, ref, type VNode } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { flushPromises } from '@vue/test-utils';

import {
  ensureMocksReset,
  requestIdleCallback,
  intersectionObserver,
} from '../../test/dom-mocks';
import { triggerEvent } from '../../test/utils';

import LazyHydrationWrapper from './LazyHydrationWrapper';

function mountWithHydration(html: string, template: VNode) {
  const app = createSSRApp({
    render: () => template,
  });

  const container = document.createElement('div');
  container.innerHTML = html;

  return {
    vnode: app.mount(container).$.subTree,
    container,
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  ensureMocksReset();
});

it('should hydrate on Interaction', async () => {
  const spy = vi.fn();

  const { vnode, container } = mountWithHydration(
    '<button>foo</button>',
    h(LazyHydrationWrapper, { onInteraction: ['focus'] }, () =>
      h('button', { onClick: spy }, 'foo')
    )
  );

  expect(vnode.el).toBe(container.firstChild);
  expect(container.textContent).toBe('foo');

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerEvent('focus', container.querySelector('button'));
  await nextTick();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spy).toHaveBeenCalled();
});

it('should hydrate when browser is idle', async () => {
  requestIdleCallback.mock();

  const spy = vi.fn();

  const { vnode, container } = mountWithHydration(
    '<button>foo</button>',
    h(LazyHydrationWrapper, { whenIdle: true }, () =>
      h('button', { onClick: spy }, 'foo')
    )
  );

  expect(vnode.el).toBe(container.firstChild);
  expect(container.textContent).toBe('foo');

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  requestIdleCallback.runIdleCallbacks();
  await nextTick();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spy).toHaveBeenCalled();

  requestIdleCallback.restore();
});

it('should never hydrate', async () => {
  const spy = vi.fn();

  const { vnode, container } = mountWithHydration(
    '<button>foo</button>',
    h(LazyHydrationWrapper, () => h('button', { onClick: spy }, 'foo'))
  );

  expect(vnode.el).toBe(container.firstChild);
  expect(container.textContent).toBe('foo');

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // should not be hydrated
  await nextTick();
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();
});

it('should hydrate when component element is visible', async () => {
  intersectionObserver.mock();

  const spy = vi.fn();

  const { vnode, container } = mountWithHydration(
    '<button>foo</button>',
    h(LazyHydrationWrapper, { whenVisible: true }, () =>
      h('button', { onClick: spy }, 'foo')
    )
  );

  expect(vnode.el).toBe(container.firstChild);
  expect(container.textContent).toBe('foo');

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  intersectionObserver.simulate({
    target: container.querySelector('button')!,
    isIntersecting: true,
  });
  await nextTick();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spy).toHaveBeenCalled();

  intersectionObserver.restore();
});

it('should hydrate when triggered', async () => {
  const spy = vi.fn();
  const triggered = ref(false);

  const { vnode, container } = mountWithHydration(
    '<button>foo</button>',
    h(LazyHydrationWrapper, { whenTriggered: triggered }, () =>
      h('button', { onClick: spy }, 'foo')
    )
  );

  expect(vnode.el).toBe(container.firstChild);
  expect(container.textContent).toBe('foo');

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggered.value = true;
  await nextTick();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spy).toHaveBeenCalled();
});

it('should emit hydrated event when component has been hydrated', async () => {
  const spyOnClick = vi.fn();
  const spyOnHydratedHook = vi.fn();
  const trigger = ref(false);

  const { vnode, container } = mountWithHydration(
    '<button>foo</button>',
    h(
      LazyHydrationWrapper,
      { whenTriggered: trigger, onHydrated: spyOnHydratedHook },
      () => h('button', { onClick: spyOnClick }, 'foo')
    )
  );

  expect(vnode.el).toBe(container.firstChild);
  expect(container.textContent).toBe('foo');

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyOnClick).not.toHaveBeenCalled();
  expect(spyOnHydratedHook).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  trigger.value = true;
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyOnClick).toHaveBeenCalled();
  expect(spyOnHydratedHook).toHaveBeenCalledOnce();
});

it('should hydrate when browser is idle (full integration)', async () => {
  requestIdleCallback.mock();

  const spy = vi.fn();
  const Comp = () =>
    h(
      'button',
      {
        onClick: spy,
      },
      'hello!'
    );

  const App = {
    render() {
      return h(LazyHydrationWrapper, { whenIdle: true }, Comp);
    },
  };

  const container = document.createElement('div');
  // server render
  container.innerHTML = await renderToString(h(App));
  // hydrate app
  createSSRApp(App).mount(container);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  requestIdleCallback.runIdleCallbacks();
  await nextTick();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spy).toHaveBeenCalled();

  requestIdleCallback.restore();
});

it('should never hydrate (full integration)', async () => {
  const spy = vi.fn();

  const Comp = () =>
    h(
      'button',
      {
        onClick: spy,
      },
      'hello!'
    );

  const App = {
    render() {
      return h(LazyHydrationWrapper, Comp);
    },
  };

  const container = document.createElement('div');
  // server render
  container.innerHTML = await renderToString(h(App));
  // hydrate app
  createSSRApp(App).mount(container);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // should not be hydrated
  await nextTick();
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();
});

it('should hydrate when component element is visible (full integration)', async () => {
  intersectionObserver.mock();

  const spy = vi.fn();

  const Comp = () =>
    h(
      'button',
      {
        onClick: spy,
      },
      'hello!'
    );

  const App = {
    render() {
      return h(LazyHydrationWrapper, { whenVisible: true }, Comp);
    },
  };

  const container = document.createElement('div');
  // server render
  container.innerHTML = await renderToString(h(App));
  // hydrate app
  createSSRApp(App).mount(container);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  intersectionObserver.simulate({
    target: container.querySelector('button')!,
    isIntersecting: true,
  });
  await nextTick();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spy).toHaveBeenCalled();

  intersectionObserver.restore();
});

it('should hydrate when triggered (full integration)', async () => {
  intersectionObserver.mock();

  const spy = vi.fn();

  const Comp = () =>
    h(
      'button',
      {
        onClick: spy,
      },
      'hello!'
    );

  const trigger = ref(false);

  const App = {
    render() {
      return h(LazyHydrationWrapper, { whenTriggered: trigger }, Comp);
    },
  };

  const container = document.createElement('div');
  // server render
  container.innerHTML = await renderToString(h(App));
  // hydrate app
  createSSRApp(App).mount(container);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spy).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  trigger.value = true;
  await nextTick();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spy).toHaveBeenCalled();

  intersectionObserver.restore();
});

it('should emit hydrated event when component has been hydrated (full integration)', async () => {
  const spyOnClick = vi.fn();
  const spyOnHydratedHook = vi.fn();
  const triggered = ref(false);

  const Comp = () =>
    h(
      'button',
      {
        onClick: spyOnClick,
      },
      'hello!'
    );

  const App = {
    render() {
      return h(
        LazyHydrationWrapper,
        { whenTriggered: triggered, onHydrated: spyOnHydratedHook },
        Comp
      );
    },
  };

  const container = document.createElement('div');
  // server render
  container.innerHTML = await renderToString(h(App));
  // hydrate app
  createSSRApp(App).mount(container);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyOnClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggered.value = true;
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyOnClick).toHaveBeenCalled();
  expect(spyOnHydratedHook).toHaveBeenCalledOnce();
});

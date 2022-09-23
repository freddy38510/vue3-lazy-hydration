# vue3-lazy-hydration

> Lazy Hydration of Server-Side Rendered Vue.js v3 Components

Inspired by [`vue-lazy-hydration`](https://github.com/maoberlehner/vue-lazy-hydration), this library brings a renderless component, composables and import wrappers to delay the hydration of pre-rendered HTML.

## Installation

Use [yarn v1](https://classic.yarnpkg.com/), [npm](https://github.com/npm/cli) or [pnpm](https://pnpm.io/) package manager to install vue3-lazy-hydration.

```bash
# install with yarn
yarn add vue3-lazy-hydration

# install with npm
npm install vue3-lazy-hydration

# install with pnpm
pnpm add vue3-lazy-hydration
```

### Importing Renderless Component

If you want to use the renderless component you can either import it directly inside your Vue SFCs (see examples below) or make it [available globally](https://vuejs.org/guide/components/registration.html#global-registration).

#### Global import for Vue

```js
import { createSSRApp } from 'vue';
import { LazyHydrationWrapper } from 'vue3-lazy-hydration';

const app = createSSRApp({});

app.component('LazyHydrationWrapper', LazyHydrationWrapper);

// or, you can use a custom registered name:
// use <LazyHydrate> instead of <LazyHydrationWrapper>
app.component('LazyHydrate', LazyHydrationWrapper);
```

#### Global import for Nuxt 3

Create a [Nuxt 3 plugin](https://v3.nuxtjs.org/guide/directory-structure/plugins/) inside the `plugins` directory. The filename doesn't matter as Nuxt [auto-imports](https://v3.nuxtjs.org/guide/directory-structure/plugins/#which-files-are-registered) all top-level files of this directory.

```js
// plugins/lazy-hydration.ts
import { LazyHydrationWrapper } from 'vue3-lazy-hydration';

export default defineNuxtPlugin((nuxtApp) => {
  // for custom registered name see Vue example above
  nuxtApp.vueApp.component('LazyHydrationWrapper', LazyHydrationWrapper);
});
```

## Usage

### Renderless Component

- Never hydrate.

  ```html
  <template>
    <LazyHydrationWrapper @hydrated="onHydrated">
      <!--
        Content never hydrated.
      -->
    </LazyHydrationWrapper>
  </template>

  <script setup>
    import { LazyHydrationWrapper } from 'vue3-lazy-hydration';

    function onHydrated() {
      console.log('this function will never be called !');
    }
  </script>
  ```

- Delays hydration until the browser is idle.

  ```html
  <template>
    <LazyHydrationWrapper :when-idle="4000" @hydrated="onHydrated">
      <!--
      Content hydrated when the browser is idle, or when the timeout
        of 4000ms has elapsed and hydration has not already taken place.
      -->
    </LazyHydrationWrapper>
  </template>
  <script setup>
    import { LazyHydrationWrapper } from 'vue3-lazy-hydration';

    function onHydrated() {
      console.log('content hydrated !');
    }
  </script>
  ```

- Delays hydration until one of the root elements is visible.

  ```html
  <template>
    <LazyHydrationWrapper
      :when-visible="{ rootMargin: '50px' }"
      @hydrated="onHydrated"
    >
      <!--
      Content hydrated when one of the root elements is visible.
      All root elements are observed with a margin of 50px.
      -->
    </LazyHydrationWrapper>
  </template>

  <script setup>
    import { LazyHydrationWrapper } from 'vue3-lazy-hydration';

    function onHydrated() {
      console.log('content hydrated !');
    }
  </script>
  ```

- Delays hydration until one of the elements triggers a DOM event (focus by default).

  ```html
  <template>
    <LazyHydrationWrapper
      :on-interaction="['click', 'touchstart']"
      @hydrated="onHydrated"
    >
      <!--
      Content hydrated when one of the elements triggers a click or touchstart event.
      -->
    </LazyHydrationWrapper>
  </template>

  <script setup>
    import { LazyHydrationWrapper } from 'vue3-lazy-hydration';

    function onHydrated() {
      console.log('content hydrated !');
    }
  </script>
  ```

- Delays hydration until manually triggered.

  ```html
  <template>
    <button @click="triggerHydration">Trigger hydration</button>

    <LazyHydrationWrapper :when-triggered="triggered" @hydrated="onHydrated">
      <!--
      Content hydrated when the above button is clicked.
      -->
    </LazyHydrationWrapper>
  </template>

  <script setup>
    import { ref } from 'vue';
    import { LazyHydrationWrapper } from 'vue3-lazy-hydration';

    const triggered = ref(false);

    function triggerHydration() {
      triggered.value = true;
    }

    function onHydrated() {
      console.log('content hydrated !');
    }
  </script>
  ```

#### Props declaration

```js
props: {

  /* Number type refers to the timeout option passed to the requestIdleCallback API
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
  */
  whenIdle: {
    default: false,
    type: [Boolean, Number],
  },

  /* Object type refers to the options passed to the IntersectionObserver API
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
  */
  whenVisible: {
    default: false,
    type: [Boolean, Object],
  },

  /*
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Element#events
  */
  onInteraction: {
    default: false,
    type: [Array, Boolean, String],
  },

  /*
  * Object type refers to a ref object
  * @see https://vuejs.org/api/reactivity-core.html#ref
  */
  whenTriggered: {
    default: undefined,
    type: [Boolean, Object],
  },
}
```

### Composables

#### `useLazyHydration()`

```html
<script setup>
  import { useLazyHydration } from 'vue3-lazy-hydration';

  // delays hydration until hydrate function is called
  const { willPerformHydration, hydrate, onHydrated, onCleanup } =
    useLazyHydration();

  if (willPerformHydration === false) {
    /**
     * The application is actually running at server-side
     * or subsequent navigation occurred at client-side after the first load.
     */

    return;
  }

  // this hook is run when component is hydrated
  // and all its child asynchronous components are resolved
  onHydrated(() => {
    console.log('content hydrated !');
  });

  // this hook is run just before hydration
  onCleanup(() => {
    console.log('clean side effects (timeout, listeners, etc...)');
  });

  // optionnaly hydrate the component
  hydrate();
</script>
```

#### `useHydrateWhenIdle({ willPerformHydration, hydrate, onCleanup }, timeout = 2000)`

```html
<script setup>
  import { useLazyHydration, useHydrateWhenIdle } from 'vue3-lazy-hydration';

  // delays hydration
  const { willPerformHydration, hydrate, onCleanup } = useLazyHydration();

  // hydrate when browser is idle
  // or when the timeout of 4000ms has elapsed
  // and the component has not already been hydrated
  useHydrateWhenIdle({ willPerformHydration, hydrate, onCleanup }, 4000);
</script>
```

#### `useHydrateWhenVisible({ hydrate, onCleanup }, observerOpts = {})`

```html
<script setup>
  import { useLazyHydration, useHydrateWhenVisible } from 'vue3-lazy-hydration';

  // delays hydration
  const { willPerformHydration, hydrate, onCleanup } = useLazyHydration();

  // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
  const observerOptions = {
    rootMargin: '0px',
    threshold: 1.0,
  };

  // hydrate when one of the root elements is visible
  useHydrateWhenVisible(
    { willPerformHydration, hydrate, onCleanup },
    observerOptions
  );
</script>
```

#### `useHydrateOnInteraction({ hydrate, onCleanup }, events = ['focus'])`

```html
<script setup>
  import { useLazyHydration, useHydrateOnInteraction } from 'vue3-lazy-hydration';

  // delays hydration
  const { willPerformHydration, hydrate, onCleanup } = useLazyHydration();

  // hydrate when one of the elements triggers a focus or click event
  useHydrateOnInteraction({ willPerformHydration, hydrate, onCleanup }, ['focus' 'click']);
</script>
```

#### `useHydrateWhenTriggered({ willPerformHydration, hydrate, onCleanup }, trigger)`

```html
<script setup>
  import { toRef } from 'vue';
  import {
    useLazyHydration,
    useHydrateWhenTriggered,
  } from 'vue3-lazy-hydration';

  const props = defineProps({
    triggerHydration: {
      default: undefined,
      type: [Boolean, Object],
    },
  });

  // delays hydration
  const result = useLazyHydration();

  // trigger hydration when the triggerHydration property changes to true
  useHydrateWhenTriggered(result, toRef(props, 'triggerHydration'));
</script>
```

### Import Wrappers

#### `hydrateNever(source)`

Wrap a component in a renderless component that will never be hydrated.

```html
<script setup>
  import { resolveComponent } from 'vue';

  import { hydrateNever } from 'vue3-lazy-hydration';

  // wrap a globally registered component resolved by its name
  const NeverHydratedComp = hydrateNever(resolveComponent('ComponentA'));

  // wrap an asynchronously loaded component
  const NeverHydratedAsyncComp = hydrateNever(() => import('./ComponentB.vue'));
</script>

<template>
  <NeverHydratedComp />

  <NeverHydratedAsyncComp />
</template>
```

#### `hydrateWhenIdle(source, timeout = 2000)`

Wrap a component in a renderless component that will be hydrated when browser is idle.

```html
<script setup>
  import { resolveComponent } from 'vue';

  import { hydrateWhenIdle } from 'vue3-lazy-hydration';

  // wrap a globally registered component resolved by its name
  const LazilyHydratedComp = hydrateWhenIdle(
    resolveComponent('ComponentA'),
    2000
  );

  // wrap an asynchronously loaded component
  const LazilyHydratedAsyncComp = hydrateWhenIdle(
    () => import('./ComponentB.vue'),
    4000
  );
</script>

<template>
  <LazilyHydratedComp />

  <LazilyHydratedAsyncComp />
</template>
```

#### `hydrateWhenVisible(source, observerOpts = {})`

Wrap a component in a renderless component that will be hydrated when one of the root elements is visible.

```html
<script setup>
  import { resolveComponent } from 'vue';

  import { hydrateWhenVisible } from 'vue3-lazy-hydration';

  // wrap a globally registered component resolved by its name
  const LazilyHydratedComp = hydrateWhenVisible(
    resolveComponent('ComponentA'),
    { rootMargin: '50px' }
  );

  // wrap an asynchronously loaded component
  const LazilyHydratedAsyncComp = hydrateWhenVisible(
    () => import('./ComponentB.vue'),
    {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );
</script>

<template>
  <LazilyHydratedComp />

  <LazilyHydratedAsyncComp />
</template>
```

#### `hydrateOnInteraction(source, events = ['focus'])`

Wrap a component in a renderless component that will be hydrated when one of the elements trigger one of the events in the `events` parameter.

```html
<script setup>
  import { resolveComponent } from 'vue';

  import { hydrateOnInteraction } from 'vue3-lazy-hydration';

  // wrap a globally registered component resolved by its name
  const LazilyHydratedComp = hydrateOnInteraction(
    resolveComponent('ComponentA')
  );

  // wrap an asynchronously loaded component
  const LazilyHydratedAsyncComp = hydrateOnInteraction(
    () => import('./ComponentB.vue'),
    ['focus', 'click', 'touchstart']
  );
</script>

<template>
  <LazilyHydratedComp />

  <LazilyHydratedAsyncComp />
</template>
```

#### `hydrateWhenTriggered(source, trigger)`

Wrap a component in a renderless component that will be hydrated when the `trigger` parameter changes to true.

```html
<script setup>
  import { ref, resolveComponent } from 'vue';

  import { hydrateOnInteraction } from 'vue3-lazy-hydration';

  const hydrationTriggered = ref(false);

  // wrap a globally registered component resolved by its name
  const LazilyHydratedComp = hydrateOnInteraction(
    resolveComponent('ComponentA'),
    hydrationTriggered
  );

  // wrap an asynchronously loaded component
  const LazilyHydratedAsyncComp = hydrateOnInteraction(
    () => import('./ComponentB.vue'),
    hydrationTriggered
  );

  function triggerHydration() => {
    hydrationTriggered.value = true
  }
</script>

<template>
  <button @click="triggerHydration">Trigger</button>

  <LazilyHydratedComp />

  <LazilyHydratedAsyncComp />
</template>
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update unit tests as appropriate.

### Development

Use the [pnpm](https://pnpm.io/) package manager to install vue3-lazy-hydration.

1. Clone the repository

   ```bash
   git clone https://github.com/freddy38510/vue3-lazy-hydration.git

   cd vue3-lazy-hydration
   ```

2. Install dependencies

   ```bash
   pnpm i
   ```

3. Start the development server which hosts a demo application to help develop the library

   ```bash
   pnpm dev
   ```

## Credits

Many thanks to **Markus Oberlehner**, the author of the package
[vue-lazy-hydration](https://github.com/maoberlehner/vue-lazy-hydration).

## License

[MIT](https://github.com/freddy38510/vue3-lazy-hydration/blob/master/LICENSE)

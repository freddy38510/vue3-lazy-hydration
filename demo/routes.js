export default [
  {
    path: '/component/LazyHydrationWrapper',
    component: () => import('./views/component/LazyHydrationWrapperDemo.vue'),
    alias: ['/', '/component'],
  },
  {
    path: '/composables/LazyHydration',
    component: () => import('./views/composables/LazyHydrationDemo.vue'),
    alias: '/composables',
  },
  {
    path: '/composables/HydrateWhenIdle',
    component: () => import('./views/composables/HydrateWhenIdleDemo.vue'),
  },
  {
    path: '/composables/HydrateWhenVisible',
    component: () => import('./views/composables/HydrateWhenVisibleDemo.vue'),
  },
  {
    path: '/composables/HydrateWhenTriggered',
    component: () => import('./views/composables/HydrateWhenTriggeredDemo.vue'),
  },
  {
    path: '/composables/HydrateOnInteraction',
    component: () => import('./views/composables/HydrateOnInteractionDemo.vue'),
  },
  {
    path: '/import-wrappers/HydrateNever',
    component: () => import('./views/import-wrappers/HydrateNeverDemo.vue'),
    alias: '/import-wrappers',
  },
  {
    path: '/import-wrappers/HydrateWhenIdle',
    component: () => import('./views/import-wrappers/HydrateWhenIdleDemo.vue'),
  },
  {
    path: '/import-wrappers/HydrateWhenVisible',
    component: () =>
      import('./views/import-wrappers/HydrateWhenVisibleDemo.vue'),
  },
  {
    path: '/import-wrappers/HydrateWhenTriggered',
    component: () =>
      import('./views/import-wrappers/HydrateWhenTriggeredDemo.vue'),
  },
  {
    path: '/import-wrappers/HydrateOnInteraction',
    component: () =>
      import('./views/import-wrappers/HydrateOnInteractionDemo.vue'),
  },
];

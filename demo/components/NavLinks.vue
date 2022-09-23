<template>
  <nav>
    <ul>
      <template v-for="{ label, children } in links" :key="label">
        <li>
          <strong>{{ label }}</strong>
          <template v-if="children">
            <ul>
              <template v-for="child in children" :key="child.label">
                <li>
                  <router-link :to="child.path">
                    {{ child.label }}
                  </router-link>
                </li>
              </template>
            </ul>
          </template>
        </li>
      </template>
    </ul>
  </nav>
  <hr />
</template>

<script setup lang="ts">
const links = [
  {
    label: 'Composables',
    path: '/composables',
    children: [
      {
        label: 'useLazyHydration',
        path: '/composables/LazyHydration',
      },
      {
        label: 'useHydrateWhenIdle',
        path: '/composables/HydrateWhenIdle',
      },
      {
        label: 'useHydrateWhenVisible',
        path: '/composables/HydrateWhenVisible',
      },
      {
        label: 'useHydrateWhenTriggered',
        path: '/composables/HydrateWhenTriggered',
      },
      {
        label: 'useHydrateOnInteraction',
        path: '/composables/HydrateOnInteraction',
      },
    ],
  },
  {
    label: 'Import Wrappers',
    path: '/import-wrappers',
    children: [
      {
        label: 'hydrateNever',
        path: '/import-wrappers/HydrateNever',
      },
      {
        label: 'hydrateWhenIdle',
        path: '/import-wrappers/HydrateWhenIdle',
      },
      {
        label: 'hydrateWhenVisible',
        path: '/import-wrappers/HydrateWhenVisible',
      },
      {
        label: 'hydrateWhenTriggered',
        path: '/import-wrappers/HydrateWhenTriggered',
      },
      {
        label: 'hydrateOnInteraction',
        path: '/import-wrappers/HydrateOnInteraction',
      },
    ],
  },
  {
    label: 'Component',
    path: '/component',
    children: [
      {
        label: 'LazyHydrationWrapper',
        path: '/component/LazyHydrationWrapper',
      },
    ],
  },
];
</script>
<style scoped>
a {
  color: blue;
  text-decoration: none;
}

a:visited {
  color: blue;
}

a:hover {
  color: green;
}

a.router-link-exact-active {
  color: green;
  border-bottom: 2px solid green;
}

nav {
  max-width: 600px;
  margin: 0 auto;
  padding: 0.75rem 0;
}

nav > ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: -0.75rem 0 0 -3rem;
  padding: 0 0 0 1.25rem;
}

nav > ul > li {
  margin: 0.75rem 0 0 3rem;
}

nav > ul > li ul {
  margin-top: 0.125rem;
  padding: 0 0 0 1.75rem;
}
</style>

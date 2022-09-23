<template>
  <h1>Vue3 Lazy Hydration Demo</h1>
  <NavLinks />
  <main class="layout">
    <router-view />
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import NavLinks from './components/NavLinks.vue';

export default defineComponent({
  name: 'App',
  components: {
    NavLinks,
  },
});
</script>

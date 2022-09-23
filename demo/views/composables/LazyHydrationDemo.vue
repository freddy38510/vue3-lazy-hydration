<script setup lang="ts">
import { ref } from 'vue';
import LazilyHydratedCounter from '../../components/LazilyHydratedCounter.vue';
import HydrationState from '../../components/HydrationState.vue';

const isHydrated = ref(false);

function onHydrated() {
  isHydrated.value = true;
}
</script>

<template>
  <h2>Composable: useLazyHydration</h2>
  <h3>Hydration state</h3>
  <HydrationState :is-hydrated="isHydrated" />
  <h3>Lazily hydrated component</h3>
  <div class="box">
    <LazilyHydratedCounter @hydrated.once="onHydrated" />
  </div>
</template>

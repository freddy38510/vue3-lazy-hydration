<script setup>
import { ref } from 'vue';
import HydrationState from '../../components/HydrationState.vue';
import LazilyHydratedCounter from '../../components/LazilyHydratedCounter.vue';

const isHydrated = ref(false);

function onHydrated() {
  isHydrated.value = true;
}
</script>

<template>
  <h2>Composable: useHydrateWhenIdle</h2>
  <h3>Hydration state</h3>
  <HydrationState :is-hydrated="isHydrated" />
  <h3>Lazily hydrated component</h3>
  <div class="box">
    <LazilyHydratedCounter timing="whenIdle" @hydrated.once="onHydrated" />
  </div>
</template>

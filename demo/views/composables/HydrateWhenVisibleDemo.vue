<script setup lang="ts">
import { ref } from 'vue';
import HydrationState from '../../components/HydrationState.vue';
import LazilyHydratedCounter from '../../components/LazilyHydratedCounter.vue';

const isHydrated = ref(false);

function onHydrated() {
  isHydrated.value = true;
}
</script>

<template>
  <h2>Composable: useHydrateWhenVisible</h2>
  <div class="sticky">
    <h3>Hydration state</h3>
    <HydrationState :is-hydrated="isHydrated" />
    <h3>Action</h3>
    <div class="box">
      <p>Please scroll to bottom to make lazily hydrated component visible.</p>
    </div>
  </div>
  <div class="push-down">
    <h3>Lazily hydrated component</h3>
    <div class="box">
      <LazilyHydratedCounter timing="whenVisible" @hydrated.once="onHydrated" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HydrationState from '../../components/HydrationState.vue';
import LazilyHydratedCounter from '../../components/LazilyHydratedCounter.vue';

const isHydrated = ref(false);

const triggered = ref(false);

function triggerHydration() {
  triggered.value = true;
}

function onHydrated() {
  isHydrated.value = true;
}
</script>

<template>
  <h2>Composable: useHydrateWhenTriggered</h2>
  <h3>Hydration state</h3>
  <HydrationState :is-hydrated="isHydrated" />
  <h3>Action</h3>
  <div class="box">
    <p>
      <button type="button" @click="triggerHydration">Trigger Hydration</button>
    </p>
  </div>
  <h3>Lazily hydrated component</h3>
  <div class="box">
    <LazilyHydratedCounter
      timing="whenTriggered"
      :triggered="triggered"
      @hydrated.once="onHydrated"
    />
  </div>
</template>

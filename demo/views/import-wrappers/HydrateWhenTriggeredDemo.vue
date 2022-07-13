<script setup>
import { ref, defineAsyncComponent } from 'vue';
import HydrationState from '../../components/HydrationState.vue';

import { hydrateWhenTriggered } from '../../../src';

const isHydrated = ref(false);

const triggered = ref(false);

function triggerHydration() {
  triggered.value = true;
}

function onHydrated() {
  isHydrated.value = true;
}

const CounterComp = hydrateWhenTriggered(
  defineAsyncComponent(() => import('../../components/CounterComp.vue')),
  triggered
);
</script>

<template>
  <h2>Import wrapper: hydrateWhenTriggered</h2>
  <h3>Hydration state</h3>
  <HydrationState :is-hydrated="isHydrated" />
  <h3>Action</h3>
  <div class="box">
    <p><button @click="triggerHydration">Trigger Hydration</button></p>
  </div>
  <h3>Wrapped component</h3>
  <div class="box">
    <CounterComp @hydrated.once="onHydrated" />
  </div>
</template>

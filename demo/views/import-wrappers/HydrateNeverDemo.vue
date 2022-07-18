<script setup>
import { ref } from 'vue';
import HydrationState from '../../components/HydrationState.vue';

import { hydrateNever } from '../../../src';

const CounterComp = hydrateNever(() =>
  import('../../components/CounterComp.vue')
);

const isHydrated = ref(false);

function onHydrated() {
  isHydrated.value = true;
}
</script>

<template>
  <h2>Import wrapper: hydrateNever</h2>
  <h3>Hydration state</h3>
  <HydrationState :is-hydrated="isHydrated" />
  <h3>Wrapped component</h3>
  <div class="box">
    <CounterComp @hydrated.once="onHydrated" />
  </div>
</template>

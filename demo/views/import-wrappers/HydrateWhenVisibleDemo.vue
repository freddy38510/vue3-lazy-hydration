<script setup>
import { ref, defineAsyncComponent } from 'vue';
import HydrationState from '../../components/HydrationState.vue';

import { hydrateWhenVisible } from '../../../src';

const CounterComp = hydrateWhenVisible(
  defineAsyncComponent(() => import('../../components/CounterComp.vue'))
);

const isHydrated = ref(false);

function onHydrated() {
  isHydrated.value = true;
}
</script>

<template>
  <h2>Import wrapper: hydrateWhenVisible</h2>
  <div class="sticky">
    <h3>Hydration state</h3>
    <HydrationState :is-hydrated="isHydrated" />
    <h3>Action</h3>
    <div class="box">
      <p>Please scroll to bottom to make lazily hydrated component visible.</p>
    </div>
  </div>
  <div class="push-down">
    <h3>Wrapped component</h3>
    <div class="box">
      <CounterComp @hydrated.once="onHydrated" />
    </div>
  </div>
</template>

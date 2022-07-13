<script setup>
import { ref, defineAsyncComponent } from 'vue';
import HydrationState from '../../components/HydrationState.vue';

import { hydrateOnInteraction } from '../../../src';

const InputComp = hydrateOnInteraction(
  defineAsyncComponent(() => import('../../components/InputComp.vue'))
);

const isHydrated = ref(false);

const message = ref('initial message');

function changeMessage() {
  if (message.value === 'initial message') {
    message.value = 'hello';

    return;
  }

  message.value = message.value === 'hello' ? 'world' : 'hello';
}

function onHydrated() {
  isHydrated.value = true;
}
</script>

<template>
  <h2>Import wrapper: hydrateOnInteraction</h2>
  <h3>Hydration state</h3>
  <HydrationState :is-hydrated="isHydrated">
    <template #state-list>
      <li>
        message: <code>{{ message }}</code>
      </li>
    </template>
  </HydrationState>
  <h3>Action</h3>
  <div class="box">
    <p>Focus on input to trigger hydration.</p>
    <p>
      <button @click="changeMessage">Change message</button> passed to v-model
      input.
    </p>
  </div>
  <h3>Wrapped component</h3>
  <div class="box">
    <InputComp v-model="message" @hydrated.once="onHydrated" />
  </div>
</template>

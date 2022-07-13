<script setup>
import { defineAsyncComponent, ref, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import HydrationState from '../../components/HydrationState.vue';

import { LazyHydrationWrapper } from '../../../src';

const CounterComp = defineAsyncComponent(() =>
  import('../../components/CounterComp.vue')
);

const InputComp = defineAsyncComponent(() =>
  import('../../components/InputComp.vue')
);

const { query, path: routePath } = useRoute();

const isHydrated = ref(false);

const triggered = ref(false);

const message = ref('initial message');

const checkedHydrationTimings = ref(Object.keys(query));

const hydrationTimings = computed(() => {
  const result = {};

  checkedHydrationTimings.value.forEach((value) => {
    result[value] = value === 'whenTriggered' ? triggered : true;
  });

  return result;
});

function changeMessage() {
  if (message.value === 'initial message') {
    message.value = 'hello';

    return;
  }

  message.value = message.value === 'hello' ? 'world' : 'hello';
}

function triggerHydration() {
  triggered.value = true;
}

function onHydrated() {
  isHydrated.value = true;
}

function onChangeHydrationTimingCheckbox() {
  nextTick(() => {
    const params = new URLSearchParams();

    checkedHydrationTimings.value.forEach((value) => {
      params.set(value, true);
    });

    window.location.href = `${routePath}?${params.toString()}`;
  });
}
</script>

<template>
  <h2>Component: LazyHydrationWrapper</h2>

  <h3>Props</h3>
  <div class="box">
    <ul>
      <template
        v-for="(_, key) in { ...LazyHydrationWrapper.props }"
        :key="key"
      >
        <li>
          <input
            :id="key"
            v-model="checkedHydrationTimings"
            :value="key"
            :checked="Object.keys(query).includes(key) ? 'checked' : false"
            type="checkbox"
            @change="onChangeHydrationTimingCheckbox"
          />
          <label :for="key">{{ key }}</label>
        </li>
      </template>
    </ul>
  </div>

  <div :class="hydrationTimings.whenVisible ? 'sticky' : ''">
    <h3>State</h3>
    <HydrationState :is-hydrated="isHydrated">
      <template #state-list>
        <li>
          message: <code>{{ message }}</code>
        </li>
      </template>
    </HydrationState>
    <h3>Action</h3>
    <div class="box">
      <template v-if="hydrationTimings.whenVisible">
        <p>
          Please scroll to bottom to make lazily hydrated component visible.
        </p>
      </template>
      <template v-if="hydrationTimings.onInteraction">
        <p>Focus on input to trigger hydration.</p>
      </template>
      <template v-if="hydrationTimings.whenTriggered">
        <p><button @click="triggerHydration">Trigger Hydration</button></p>
      </template>
      <p>
        <button @click="changeMessage">Change message</button> passed to v-model
        input.
      </p>
    </div>
  </div>

  <div :class="hydrationTimings.whenVisible ? 'push-down' : ''">
    <h3>Lazily hydrated content</h3>
    <div class="box">
      <LazyHydrationWrapper
        v-bind="hydrationTimings"
        @hydrated.once="onHydrated"
      >
        <CounterComp />
        <hr />
        <InputComp v-model="message" />
      </LazyHydrationWrapper>
    </div>
  </div>
</template>

<style scoped>
hr {
  margin: 1.5rem 0;
}
</style>

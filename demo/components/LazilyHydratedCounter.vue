<script setup lang="ts">
import { ref, toRef } from 'vue';
import {
  useLazyHydration,
  useHydrateWhenIdle,
  useHydrateWhenTriggered,
  useHydrateWhenVisible,
  useHydrateOnInteraction,
} from '../../src';

const props = defineProps({
  timing: {
    type: String,
    default: undefined,
  },
  triggered: {
    type: [Boolean, Object],
    default: undefined,
  },
});

const emit = defineEmits(['hydrated']);

const count = ref(0);

function onClick() {
  count.value += 1;
}

const result = useLazyHydration();

if (props.timing === 'whenIdle') {
  useHydrateWhenIdle(result);
}

if (props.timing === 'whenVisible') {
  useHydrateWhenVisible(result);
}

if (props.timing === 'onInteraction') {
  useHydrateOnInteraction(result, ['click', 'focus']);
}

if (props.timing === 'whenTriggered') {
  useHydrateWhenTriggered(result, toRef(props, 'triggered'));
}

result.onHydrated(() => emit('hydrated'));
</script>
<template>
  <div>
    <p>
      <button type="button" @click="onClick">Increment Counter</button>
    </p>
    <p>
      Counter: <code>{{ count }}</code>
    </p>
  </div>
</template>

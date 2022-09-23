<script setup lang="ts">
import { useLazyHydration, useHydrateOnInteraction } from '../../src';

defineProps({
  modelValue: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue', 'hydrated']);

const result = useLazyHydration();

useHydrateOnInteraction(result);

result.onHydrated(() => emit('hydrated'));
</script>
<template>
  <div>
    <p>
      <input
        :value="modelValue"
        @input="
          $emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
    </p>
    <p>
      Input v-model: <code>{{ modelValue }}</code>
    </p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: undefined,
  },
});
defineEmits(['update:modelValue']);
</script>
<template>
  <div>
    <p>
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </p>
    <p>
      Input v-model: <code>{{ modelValue }}</code>
    </p>
  </div>
</template>

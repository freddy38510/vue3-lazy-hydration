<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);

function onClick() {
  count.value += 1;
}
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

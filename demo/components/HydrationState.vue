<script setup lang="ts">
import { getCurrentInstance, onMounted, ref, toRef } from 'vue';

const props = defineProps({
  isHydrated: {
    type: Boolean,
  },
});

const hasInitialVnode = getCurrentInstance()?.vnode.el !== null;

const showReload = ref();
const willPerformHydration = ref();
const isHydrated = toRef(props, 'isHydrated');

function stateValueClass(value: boolean) {
  return value === true ? 'text-green' : 'text-red';
}

function reload() {
  window.location.reload();
}

// set the initial values at client-side to avoid hydration node mismatch
onMounted(() => {
  willPerformHydration.value = hasInitialVnode;

  showReload.value = !hasInitialVnode;
});
</script>

<template>
  <div class="box">
    <p v-if="showReload" class="text-red">
      Please <button type="button" @click="reload">Reload</button> to see lazy
      hydration effect.
    </p>
    <ul>
      <li>
        willPerformHydration:
        <code :class="stateValueClass(willPerformHydration)">{{
          willPerformHydration
        }}</code>
      </li>
      <li>
        isHydrated:
        <code :class="stateValueClass(isHydrated)">{{ isHydrated }}</code>
      </li>
      <slot name="state-list" />
    </ul>
  </div>
</template>

<style scoped>
ul {
  list-style: square;
}

.text-green {
  color: green;
}

.text-red {
  color: red;
}
</style>

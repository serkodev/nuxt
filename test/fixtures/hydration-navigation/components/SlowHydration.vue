<script setup lang="ts">
await new Promise(resolve => setTimeout(resolve, 1000))
</script>

<template>
  <div data-testid="slow-hydration-child">
    slow widget ready
  </div>
</template>

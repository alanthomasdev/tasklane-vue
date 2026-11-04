<!-- An icon from the sprite in index.html, e.g. <AppIcon name="plus" /> -->
<script setup>
defineProps({ name: { type: String, required: true } })
</script>

<template>
  <svg class="ic" aria-hidden="true"><use :href="`#i-${name}`" /></svg>
</template>

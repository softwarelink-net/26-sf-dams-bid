<template>
  <div>
    <StickyTopBanner />
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import StickyTopBanner from '@/components/StickyTopBanner.vue'
</script>

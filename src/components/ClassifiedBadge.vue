<template>
  <span
    class="inline-flex items-center border px-1.5 py-0.5 text-[10px] font-medium tracking-wide"
    :class="tone"
  >
    {{ level }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: { type: String, default: '内部' },
})

const tone = computed(() => {
  const map = {
    机密: 'class-机密',
    秘密: 'class-秘密',
    内部: 'class-内部',
    公开: 'class-公开',
  }
  return map[props.level] || 'class-内部'
})
</script>

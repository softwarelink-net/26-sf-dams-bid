<template>
  <div class="flex items-center gap-1 border border-slate-700 bg-slate-950/70 p-1">
    <button
      v-for="item in roles"
      :key="item.role"
      type="button"
      class="px-2.5 py-1 text-[11px] tracking-wide transition"
      :class="active === item.role
        ? 'bg-hangar-signal text-white'
        : 'text-slate-400 hover:text-slate-100'"
      @click="$emit('switch', item.role)"
    >
      {{ item.short }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  active: { type: String, default: '' },
})
defineEmits(['switch'])

const roles = [
  { role: 'sec_admin', short: '保密员' },
  { role: 'sys_admin', short: '系统员' },
  { role: 'audit_admin', short: '审计员' },
  { role: 'archivist', short: '归档员' },
]
</script>

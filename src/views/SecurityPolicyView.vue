<template>
  <div class="space-y-6">
    <div>
      <p class="kicker">MAC · Dual control</p>
      <h2 class="brand-serif text-2xl mt-1">密级策略与定密审批</h2>
    </div>

    <ul class="space-y-3">
      <li v-for="p in policies" :key="p.id" class="panel p-4 flex items-center justify-between gap-4">
        <div>
          <p class="font-medium">{{ p.name }}</p>
          <p class="text-xs text-slate-400 mt-1">{{ p.note }} · {{ p.value }}</p>
        </div>
        <button class="btn-ghost !text-xs" type="button" @click="toggle(p)">
          {{ p.enabled ? '已启用' : '已停用' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/stores/api'

const policies = ref([])

async function load() {
  const data = await api.policies()
  policies.value = data.policies || []
}

async function toggle(p) {
  await api.updatePolicy({ id: p.id, enabled: !p.enabled })
  await load()
}

onMounted(load)
</script>

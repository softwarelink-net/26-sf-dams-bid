<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="kicker">Immutable ledger</p>
        <h2 class="brand-serif text-2xl mt-1">安全审计追踪</h2>
        <p class="text-sm text-slate-400 mt-2">只读、不可改、可导出。系统管理员与保密员在此页面将被路由守卫拦截。</p>
      </div>
      <button class="btn-ghost" type="button" @click="exportCsv">导出 CSV</button>
    </div>

    <div class="panel p-4 font-mono text-[12px] leading-6 max-h-[70vh] overflow-auto bg-black/35">
      <p v-for="row in logs" :key="row.id" :class="row.status === 'BLOCKED' ? 'text-red-300' : row.status === 'WARNING' ? 'text-amber-200' : 'text-emerald-200/80'">
        [{{ row.created_at }}] {{ row.status }} {{ row.operator_role }} {{ row.action_type }} {{ row.resource_target }} · {{ row.client_ip }} — {{ row.details }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/stores/api'

const logs = ref([])

async function load() {
  const data = await api.logs()
  logs.value = data.logs || []
}

async function exportCsv() {
  const res = await api.exportLogs()
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sf-dams-audit.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(load)
</script>

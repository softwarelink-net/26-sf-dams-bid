<template>
  <div class="space-y-6">
    <div>
      <p class="kicker">Need-to-know</p>
      <h2 class="brand-serif text-2xl mt-1">借阅审批 / 电子调阅</h2>
      <p class="text-sm text-slate-400 mt-2">公开、内部自动放行；秘密与机密须安全保密员定密审批。</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-[11px] text-slate-500 border-b border-slate-800">
          <tr>
            <th class="py-2 text-left">单号</th>
            <th class="py-2 text-left">档号</th>
            <th class="py-2 text-left">用途</th>
            <th class="py-2 text-left">密级</th>
            <th class="py-2 text-left">状态</th>
            <th v-if="auth.role === 'sec_admin'" class="py-2 text-left">审批</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in borrows" :key="row.id" class="border-b border-slate-800/70">
            <td class="py-3 font-mono text-xs">{{ row.id }}</td>
            <td class="py-3 font-mono text-xs">{{ row.archive_code }}</td>
            <td class="py-3">{{ row.purpose }}</td>
            <td class="py-3"><ClassifiedBadge :level="row.security_class" /></td>
            <td class="py-3 font-mono text-xs">{{ row.status }}</td>
            <td v-if="auth.role === 'sec_admin'" class="py-3 space-x-2">
              <button
                v-if="row.status === 'PENDING'"
                class="text-xs text-emerald-300"
                type="button"
                @click="decide(row, false)"
              >
                同意
              </button>
              <button
                v-if="row.status === 'PENDING'"
                class="text-xs text-red-300"
                type="button"
                @click="decide(row, true)"
              >
                驳回
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import ClassifiedBadge from '@/components/ClassifiedBadge.vue'

const auth = useAuthStore()
const borrows = ref([])

async function load() {
  const data = await api.borrows()
  borrows.value = data.borrows || []
}

async function decide(row, reject) {
  await api.approveBorrow(row.id, reject)
  await load()
}

onMounted(load)
</script>

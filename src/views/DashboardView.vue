<template>
  <div class="space-y-8">
    <section>
      <p class="kicker">Xinchuang Fleet · 18-month watch</p>
      <h2 class="brand-serif mt-2 text-2xl">汉中基地信创四节点</h2>
      <p class="mt-2 max-w-2xl text-sm text-slate-400">
        鲲鹏主备、飞腾转码与海光审计仓组成软硬一体拓扑。连续正常运行 {{ stats.stability_days || 142 }} / 540 天，对标合同 18 个月零缺陷窗口。
      </p>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <NodeCard v-for="node in nodes" :key="node.node_id" :node="node" />
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
      <div class="panel p-6">
        <p class="font-cond tracking-[0.2em] text-xs text-slate-500">ZERO DEFECT</p>
        <p class="mt-4 font-cond text-6xl text-amber-200">{{ stats.stability_days || 142 }}</p>
        <p class="text-sm text-slate-400 mt-1">连续健康运行（天） / 目标 540</p>
        <div class="mt-5 h-1.5 bg-slate-800">
          <div class="h-full bg-amber-500 transition-all" :style="{ width: progress + '%' }" />
        </div>
        <p class="mt-4 text-xs text-slate-500">内存泄漏健康指数 {{ leak }} · 自愈守护进程 daemon-ok</p>
      </div>

      <div>
        <div class="flex items-end justify-between mb-3">
          <h3 class="brand-serif text-lg">最近归档</h3>
          <RouterLink v-if="auth.role === 'archivist'" to="/archives" class="text-xs text-hangar-signal">进入收管存用</RouterLink>
        </div>
        <table class="w-full text-sm">
          <thead class="text-[11px] text-slate-500 border-b border-slate-800">
            <tr>
              <th class="py-2 text-left font-medium">档号</th>
              <th class="py-2 text-left font-medium">题名</th>
              <th class="py-2 text-left font-medium">密级</th>
              <th class="py-2 text-left font-medium">四性</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in archives" :key="row.id" class="border-b border-slate-800/80">
              <td class="py-2.5 font-mono text-xs">{{ row.archive_code }}</td>
              <td class="py-2.5 pr-3">{{ row.title }}</td>
              <td class="py-2.5"><ClassifiedBadge :level="row.security_class" /></td>
              <td class="py-2.5 font-mono text-xs">{{ row.four_check_status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import NodeCard from '@/components/NodeCard.vue'
import ClassifiedBadge from '@/components/ClassifiedBadge.vue'

const auth = useAuthStore()
const nodes = ref([])
const archives = ref([])
const stats = ref({})
const leak = ref('0.86')
let timer = 0

const progress = computed(() => {
  const cur = stats.value.stability_days || 142
  const goal = stats.value.stability_goal || 540
  return Math.min(100, (cur / goal) * 100)
})

async function load() {
  try {
    const data = await api.dashboard()
    nodes.value = data.nodes || []
    archives.value = data.recent_archives || []
    stats.value = data.stats || {}
    const stab = await api.stability().catch(() => null)
    if (stab) leak.value = String(stab.leak_health)
  } catch {
    /* keep empty */
  }
}

onMounted(async () => {
  await load()
  timer = window.setInterval(load, 8000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

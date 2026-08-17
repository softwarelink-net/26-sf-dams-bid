<template>
  <div class="space-y-8">
    <div>
      <p class="kicker">Kunpeng · Feiteng · Hygon</p>
      <h2 class="brand-serif text-2xl mt-1">信创专用服务器集群</h2>
      <p class="text-sm text-slate-400 mt-2">4 台国产化节点实时负荷、归档流水线健康度与 18 个月稳定运行跟踪。</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NodeCard v-for="node in nodes" :key="node.node_id" :node="node" />
    </div>

    <section class="panel p-6">
      <p class="font-cond tracking-[0.18em] text-xs text-slate-500">18 MONTH RELIABILITY</p>
      <div class="mt-4 flex flex-wrap items-end gap-10">
        <div>
          <p class="font-cond text-5xl text-amber-200">{{ stability.current_days }}</p>
          <p class="text-xs text-slate-400 mt-1">连续正常天数</p>
        </div>
        <div>
          <p class="font-cond text-5xl">{{ stability.remain_days }}</p>
          <p class="text-xs text-slate-400 mt-1">距 540 天验收窗口</p>
        </div>
        <div>
          <p class="font-cond text-5xl">{{ Math.round((stability.leak_health || 0) * 100) }}%</p>
          <p class="text-xs text-slate-400 mt-1">抗泄漏健康</p>
        </div>
      </div>
      <div class="mt-6 h-1.5 bg-slate-800">
        <div class="h-full bg-hangar-signal" :style="{ width: (stability.progress_pct || 0) + '%' }" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '@/stores/api'
import NodeCard from '@/components/NodeCard.vue'

const nodes = ref([])
const stability = ref({})
let timer = 0

async function load() {
  const [n, s] = await Promise.all([api.nodes(), api.stability()])
  nodes.value = n.nodes || []
  stability.value = s
}

onMounted(async () => {
  await load()
  timer = window.setInterval(load, 6000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

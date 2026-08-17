import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './api'

export const useMonitorStore = defineStore('monitor', () => {
  const nodes = ref([])
  const stability = ref({
    current_days: 142,
    goal_days: 540,
    remain_days: 398,
    progress_pct: 26.3,
    leak_health: 0.86,
  })
  const online = ref(true)

  async function refresh() {
    try {
      const [n, s, h] = await Promise.all([
        api.nodes().catch(() => ({ nodes: [] })),
        api.stability().catch(() => stability.value),
        api.health().catch(() => ({ ok: false })),
      ])
      if (n.nodes) nodes.value = n.nodes
      if (s.current_days != null) stability.value = s
      online.value = Boolean(h.ok)
    } catch {
      online.value = false
    }
  }

  return { nodes, stability, online, refresh }
})

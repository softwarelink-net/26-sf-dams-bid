<template>
  <article class="panel p-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="font-mono text-[11px] text-hangar-signal">{{ node.node_id }}</p>
        <h3 class="mt-1 text-sm font-semibold leading-snug">{{ node.node_name }}</h3>
        <p class="mt-1 text-xs text-slate-400">{{ node.cpu_arch }} · {{ node.os_name }}</p>
      </div>
      <span
        class="text-[10px] tracking-widest border px-1.5 py-0.5"
        :class="node.status === 'ONLINE' ? 'text-emerald-300 border-emerald-700/50' : 'text-amber-300 border-amber-700/50'"
      >
        {{ node.status }}
      </span>
    </div>
    <dl class="mt-4 space-y-2 text-xs">
      <div>
        <div class="flex justify-between text-slate-400">
          <dt>CPU</dt>
          <dd class="font-mono text-slate-200">{{ fmt(node.cpu_usage_pct) }}%</dd>
        </div>
        <div class="mt-1 h-1 bg-slate-800">
          <div class="h-full bg-hangar-signal transition-all duration-700" :style="{ width: fmt(node.cpu_usage_pct) + '%' }" />
        </div>
      </div>
      <div>
        <div class="flex justify-between text-slate-400">
          <dt>内存</dt>
          <dd class="font-mono text-slate-200">{{ fmt(node.memory_usage_pct) }}%</dd>
        </div>
        <div class="mt-1 h-1 bg-slate-800">
          <div class="h-full bg-amber-500 transition-all duration-700" :style="{ width: fmt(node.memory_usage_pct) + '%' }" />
        </div>
      </div>
      <div class="flex justify-between text-slate-400 pt-1">
        <dt>{{ node.ip_address }}</dt>
        <dd>连续正常 {{ node.consecutive_normal_days }} 天</dd>
      </div>
    </dl>
  </article>
</template>

<script setup>
defineProps({
  node: { type: Object, required: true },
})

function fmt(n) {
  return Number(n || 0).toFixed(1)
}
</script>

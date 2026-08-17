<template>
  <ol class="grid grid-cols-1 md:grid-cols-4 gap-3">
    <li
      v-for="(step, i) in steps"
      :key="step.key"
      class="panel p-4 transition duration-500"
      :class="tone(step)"
    >
      <p class="font-cond text-xs tracking-[0.2em] text-slate-500">0{{ i + 1 }}</p>
      <h3 class="mt-2 brand-serif text-lg">{{ step.name }}</h3>
      <p class="mt-1 text-xs text-slate-400 leading-relaxed">{{ step.desc }}</p>
      <p class="mt-3 font-mono text-[11px]" :class="step.state === 'run' ? 'text-amber-300' : 'text-slate-500'">
        {{ label(step) }}
      </p>
    </li>
  </ol>
</template>

<script setup>
const props = defineProps({
  steps: { type: Array, default: () => [] },
})

function tone(step) {
  if (step.state === 'pass') return 'border-emerald-500/40'
  if (step.state === 'fail') return 'border-red-500/50'
  if (step.state === 'run') return 'border-amber-400/50'
  return ''
}

function label(step) {
  if (step.state === 'pass') return 'PASSED · ' + (step.evidence || '')
  if (step.state === 'fail') return 'FAILED'
  if (step.state === 'run') return 'DETECTING…'
  return 'STANDBY'
}

void props
</script>

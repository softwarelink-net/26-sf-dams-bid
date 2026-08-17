<template>
  <div class="max-w-xl">
    <p class="kicker">403 · Three-role isolation</p>
    <h2 class="brand-serif text-3xl mt-3">访问已被安全策略阻断</h2>
    <p class="mt-4 text-slate-400 leading-relaxed">
      当前身份 <span class="text-amber-200">{{ auth.roleLabel }}</span>
      无权进入 <span class="font-mono text-slate-200">{{ route.query.from || '/audit' }}</span>。
      事件已写入不可篡改审计日志。
    </p>
    <RouterLink to="/dashboard" class="btn-signal mt-8 inline-flex">返回运行总览</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
</script>

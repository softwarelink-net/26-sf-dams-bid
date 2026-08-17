<template>
  <div class="relative min-h-[calc(100vh-40px)] overflow-hidden">
    <img :src="hero" alt="" class="absolute inset-0 h-full w-full object-cover" />
    <div class="absolute inset-0 bg-[#070b16]/78" />

    <div class="relative z-10 mx-auto flex min-h-[calc(100vh-40px)] max-w-6xl flex-col justify-center px-6 py-12 md:flex-row md:items-end md:justify-between md:px-10">
      <div class="max-w-xl pb-10">
        <p class="brand-serif text-2xl text-amber-100">陕西飞机工业有限责任公司</p>
        <h1 class="mt-4 brand-serif text-4xl text-white md:text-5xl">三员分立认证门</h1>
        <p class="mt-4 text-slate-300">系统管理员、安全保密管理员与安全审计员权限互斥，口令与 CA 证书双通道鉴别。</p>
      </div>

      <form class="w-full max-w-md border border-white/10 bg-[#0b1329]/85 p-6 backdrop-blur-sm" @submit.prevent="submit">
        <div class="mb-5 flex border-b border-slate-700">
          <button type="button" class="flex-1 py-2 text-sm" :class="mode === 'password' ? 'text-amber-300 border-b border-amber-400' : 'text-slate-500'" @click="mode = 'password'">口令登录</button>
          <button type="button" class="flex-1 py-2 text-sm" :class="mode === 'ca' ? 'text-amber-300 border-b border-amber-400' : 'text-slate-500'" @click="mode = 'ca'">CA 数字证书</button>
        </div>

        <div v-if="mode === 'password'" class="space-y-4">
          <label class="block text-xs text-slate-400">
            账号
            <input v-model="username" class="mt-1 w-full border border-slate-600 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-hangar-signal" placeholder="sec_admin" />
          </label>
          <label class="block text-xs text-slate-400">
            口令
            <input v-model="password" type="password" class="mt-1 w-full border border-slate-600 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-hangar-signal" />
          </label>
        </div>

        <label v-else class="block text-xs text-slate-400">
          选择演示证书
          <select v-model="caSn" class="mt-1 w-full border border-slate-600 bg-black/30 px-3 py-2.5 text-sm outline-none">
            <option value="CA-SEC-998811">CA-SEC-998811 · 赵安保</option>
            <option value="CA-SYS-998822">CA-SYS-998822 · 钱运维</option>
            <option value="CA-AUD-998833">CA-AUD-998833 · 孙审计</option>
            <option value="CA-ARC-998844">CA-ARC-998844 · 李档案</option>
          </select>
        </label>

        <p class="mt-4 text-[11px] leading-relaxed text-slate-500">
          sec_admin / SecAdmin@2026 · sys_admin / SysAdmin@2026 · audit_admin / AuditAdmin@2026 · archivist / Archive@2026
        </p>
        <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
        <button class="btn-signal mt-5 w-full" :disabled="loading" type="submit">
          {{ loading ? '鉴别中…' : '进入工作台' }}
        </button>
        <RouterLink to="/" class="mt-3 block text-center text-xs text-slate-500 hover:text-slate-300">返回招标公告</RouterLink>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import hero from '@/assets/hangar-hero.png'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const mode = ref('password')
const username = ref('sec_admin')
const password = ref('SecAdmin@2026')
const caSn = ref('CA-SEC-998811')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const payload = mode.value === 'ca' ? { ca_sn: caSn.value } : { username: username.value, password: password.value }
    await auth.login(payload)
    router.replace(route.query.redirect || '/dashboard')
  } catch (e) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

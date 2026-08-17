<template>
  <div class="relative min-h-[calc(100vh-40px)] flex bg-hangar-void">
    <WatermarkOverlay
      :user-code="auth.user?.username || 'GUEST'"
      :role="auth.roleLabel"
      :client-ip="auth.clientIp"
      :classified="auth.securityLevel"
    />

    <aside class="relative z-10 w-[220px] shrink-0 border-r border-slate-800 bg-[#080f1f] flex flex-col">
      <div class="px-4 py-5 border-b border-slate-800">
        <p class="kicker">0730-2611010525/01</p>
        <p class="brand-serif text-[15px] leading-snug mt-1">陕飞数字档案</p>
        <p class="text-[11px] text-slate-500 mt-1">三员分立工作台</p>
      </div>
      <nav class="flex-1 py-3">
        <RouterLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
          active-class="!text-white !bg-hangar-signal/15 !border-hangar-signal"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="p-3 border-t border-slate-800 text-[11px] text-slate-500">
        信创节点 4/4 · 分保机密级演示
      </div>
    </aside>

    <div class="relative z-10 flex-1 min-w-0 flex flex-col">
      <header class="h-14 border-b border-slate-800 px-4 flex items-center justify-between gap-3 bg-[#0b1329]/90">
        <div>
          <p class="text-[11px] text-slate-500">陕飞工业 / {{ route.meta.title }}</p>
          <h1 class="text-sm font-semibold">{{ route.meta.title }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <RoleSwitcher :active="auth.role" @switch="onSwitch" />
          <div class="hidden lg:block text-right">
            <p class="text-xs">{{ auth.displayName }}</p>
            <p class="text-[10px] text-slate-500">{{ auth.roleLabel }} · {{ auth.securityLevel }}</p>
          </div>
          <button class="btn-ghost !py-1.5 !text-xs" type="button" @click="onLogout">退出</button>
        </div>
      </header>
      <main class="flex-1 overflow-auto p-5 md:p-7">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  Archive,
  BookOpenCheck,
  FileText,
  LayoutDashboard,
  ScrollText,
  Server,
  Shield,
  Users,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import WatermarkOverlay from '@/components/WatermarkOverlay.vue'
import RoleSwitcher from '@/components/RoleSwitcher.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const nav = [
  { to: '/dashboard', name: 'dashboard', label: '运行总览', icon: LayoutDashboard },
  { to: '/archives', name: 'archives', label: '收管存用', icon: Archive },
  { to: '/borrow', name: 'borrow', label: '借阅调阅', icon: BookOpenCheck },
  { to: '/security', name: 'security', label: '密级策略', icon: Shield },
  { to: '/users', name: 'users', label: '用户管理', icon: Users },
  { to: '/xinchuang', name: 'xinchuang', label: '信创集群', icon: Server },
  { to: '/audit', name: 'audit', label: '安全审计', icon: ScrollText },
  { to: '/bid-notice', name: 'bid-notice', label: '招标公告', icon: FileText },
]

const visibleNav = computed(() =>
  nav.filter((item) => item.name === 'bid-notice' || auth.canAccess(item.name)),
)

async function onSwitch(role) {
  await auth.switchRole(role)
  if (!auth.canAccess(route.name) && route.name !== 'forbidden') {
    router.replace('/dashboard')
  }
}

async function onLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

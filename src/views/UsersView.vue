<template>
  <div class="space-y-8">
    <div>
      <p class="kicker">Least privilege</p>
      <h2 class="brand-serif text-2xl mt-1">{{ auth.role === 'sec_admin' ? '人员密级一览（只读）' : '用户开户与参数' }}</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-[11px] text-slate-500 border-b border-slate-800">
          <tr>
            <th class="py-2 text-left">账号</th>
            <th class="py-2 text-left">姓名</th>
            <th class="py-2 text-left">角色</th>
            <th class="py-2 text-left">密级</th>
            <th class="py-2 text-left">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b border-slate-800/70">
            <td class="py-3 font-mono text-xs">{{ u.username }}</td>
            <td class="py-3">{{ u.real_name }}</td>
            <td class="py-3">{{ u.role }}</td>
            <td class="py-3"><ClassifiedBadge :level="u.security_level" /></td>
            <td class="py-3">
              <button
                v-if="auth.role === 'sys_admin'"
                class="text-xs text-hangar-signal"
                type="button"
                @click="toggle(u)"
              >
                {{ u.is_active ? '停用' : '启用' }}
              </button>
              <span v-else class="text-xs text-slate-500">{{ u.is_active ? '启用' : '停用' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <form v-if="auth.role === 'sys_admin'" class="panel p-4 grid grid-cols-1 md:grid-cols-4 gap-3" @submit.prevent="create">
      <input v-model="form.username" required class="border border-slate-700 bg-black/20 px-3 py-2 text-sm" placeholder="账号" />
      <input v-model="form.real_name" required class="border border-slate-700 bg-black/20 px-3 py-2 text-sm" placeholder="姓名" />
      <select v-model="form.role" class="border border-slate-700 bg-black/20 px-3 py-2 text-sm">
        <option value="archivist">archivist</option>
        <option value="general_user">general_user</option>
      </select>
      <button class="btn-signal" type="submit">开户（不可提权至三员）</button>
    </form>

    <section v-if="auth.role === 'sys_admin' && configs.length" class="panel p-4 space-y-2">
      <p class="text-sm font-medium">系统参数</p>
      <p v-for="c in configs" :key="c.key" class="text-xs text-slate-400">
        <span class="font-mono text-slate-200">{{ c.key }}</span>
        · {{ c.value }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import ClassifiedBadge from '@/components/ClassifiedBadge.vue'

const auth = useAuthStore()
const users = ref([])
const configs = ref([])
const form = ref({ username: '', real_name: '', role: 'general_user' })

async function load() {
  const data = await api.users()
  users.value = data.users || []
  if (auth.role === 'sys_admin') {
    try {
      const c = await api.configs()
      configs.value = c.configs || []
    } catch {
      configs.value = []
    }
  }
}

async function toggle(u) {
  await api.patchUser(u.id, { is_active: u.is_active ? 0 : 1 })
  await load()
}

async function create() {
  await api.createUser(form.value)
  form.value = { username: '', real_name: '', role: 'general_user' }
  await load()
}

onMounted(load)
</script>

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from './api'

export const ROLE_LABELS = {
  sec_admin: '安全保密管理员',
  sys_admin: '系统管理员',
  audit_admin: '安全审计员',
  archivist: '档案专员',
  general_user: '普通查阅员',
}

export const ROUTE_ROLES = {
  dashboard: ['sec_admin', 'sys_admin', 'audit_admin', 'archivist', 'general_user'],
  archives: ['archivist'],
  'archive-detail': ['archivist', 'sec_admin', 'general_user'],
  borrow: ['sec_admin', 'archivist', 'general_user'],
  audit: ['audit_admin'],
  users: ['sys_admin', 'sec_admin'],
  security: ['sec_admin'],
  xinchuang: ['sys_admin'],
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref(null)
    const user = ref(null)

    const isAuthenticated = computed(() => Boolean(token.value && user.value))
    const role = computed(() => user.value?.role || '')
    const displayName = computed(() => user.value?.real_name || '未登录')
    const roleLabel = computed(() => ROLE_LABELS[role.value] || role.value)
    const clientIp = computed(() => user.value?.client_ip || '192.168.1.88')
    const securityLevel = computed(() => user.value?.security_level || '内部')

    function persist(nextToken, nextUser) {
      token.value = nextToken
      user.value = nextUser
      if (nextToken) localStorage.setItem(api.tokenKey, nextToken)
      else localStorage.removeItem(api.tokenKey)
    }

    async function login(payload) {
      const data = await api.login(payload)
      persist(data.token, data.user)
      return data.user
    }

    async function switchRole(nextRole) {
      const data = await api.switchRole(nextRole)
      persist(data.token, data.user)
      return data.user
    }

    async function logout() {
      try {
        await api.logout()
      } catch {
        /* ignore */
      }
      persist(null, null)
    }

    function hydrateToken() {
      const t = localStorage.getItem(api.tokenKey)
      if (t && !token.value) token.value = t
    }

    function canAccess(routeName) {
      const roles = ROUTE_ROLES[routeName]
      if (!roles) return true
      return roles.includes(role.value)
    }

    return {
      token,
      user,
      isAuthenticated,
      role,
      displayName,
      roleLabel,
      clientIp,
      securityLevel,
      login,
      logout,
      switchRole,
      hydrateToken,
      canAccess,
    }
  },
  {
    persist: {
      key: 'sf-dams-auth',
      paths: ['token', 'user'],
    },
  },
)

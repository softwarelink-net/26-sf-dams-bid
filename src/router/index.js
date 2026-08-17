import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/stores/api'

const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const MainLayout = () => import('@/layouts/MainLayout.vue')

const routes = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/BidNoticeView.vue'),
        meta: { public: true, title: '招标公告' },
      },
    ],
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { public: true, title: '三员认证' },
      },
    ],
  },
  {
    path: '/bid-notice',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'bid-notice',
        component: () => import('@/views/BidNoticeView.vue'),
        meta: { public: true, title: '招标公告' },
      },
    ],
  },
  {
    path: '/dashboard',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '运行总览' },
      },
    ],
  },
  {
    path: '/archives',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'archives',
        component: () => import('@/views/ArchiveManageView.vue'),
        meta: { title: '收管存用' },
      },
      {
        path: ':id',
        name: 'archive-detail',
        component: () => import('@/views/ArchiveDetailView.vue'),
        meta: { title: '电子调阅' },
      },
    ],
  },
  {
    path: '/borrow',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'borrow',
        component: () => import('@/views/BorrowView.vue'),
        meta: { title: '借阅审批' },
      },
    ],
  },
  {
    path: '/audit',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'audit',
        component: () => import('@/views/AuditLogView.vue'),
        meta: { title: '安全审计' },
      },
    ],
  },
  {
    path: '/xinchuang',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'xinchuang',
        component: () => import('@/views/XinchuangView.vue'),
        meta: { title: '信创集群' },
      },
    ],
  },
  {
    path: '/security',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'security',
        component: () => import('@/views/SecurityPolicyView.vue'),
        meta: { title: '密级策略' },
      },
    ],
  },
  {
    path: '/users',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
        meta: { title: '用户与配置' },
      },
    ],
  },
  {
    path: '/403',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'forbidden',
        component: () => import('@/views/ForbiddenView.vue'),
        meta: { title: '访问被拒绝' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  auth.hydrateToken()

  if (to.meta.public) return true

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name && to.name !== 'forbidden' && !auth.canAccess(to.name)) {
    try {
      await api.reportBlocked({
        path: to.fullPath,
        details: `角色 ${auth.role} 越权访问 ${to.fullPath}`,
      })
    } catch {
      /* ignore */
    }
    return { name: 'forbidden', query: { from: to.fullPath } }
  }

  return true
})

export default router

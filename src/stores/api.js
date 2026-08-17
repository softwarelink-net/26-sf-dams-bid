const TOKEN_KEY = 'sf_dams_token'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const contentType = res.headers.get('Content-Type') || ''
  if (contentType.includes('text/csv')) {
    if (!res.ok) throw new Error('导出失败')
    return res
  }
  const data = await res.json().catch(() => ({ ok: false, error: 'Invalid JSON' }))
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  tokenKey: TOKEN_KEY,
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  switchRole: (role) => request('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) }),
  dashboard: () => request('/api/dashboard'),
  bid: () => request('/api/bid'),
  health: () => request('/api/health'),
  archives: () => request('/api/archives'),
  archive: (id) => request(`/api/archives/${id}`),
  ingest: (payload) => request('/api/archives', { method: 'POST', body: JSON.stringify(payload) }),
  fourCheck: (id) => request(`/api/archives/${id}/four-check`, { method: 'POST' }),
  borrows: () => request('/api/archives/borrows'),
  requestBorrow: (payload) => request('/api/archives/borrows', { method: 'POST', body: JSON.stringify(payload) }),
  approveBorrow: (id, reject = false) =>
    request(`/api/archives/borrows/${id}/approve`, { method: 'POST', body: JSON.stringify({ reject }) }),
  logs: () => request('/api/audit/logs'),
  reportBlocked: (payload) => request('/api/audit/blocked', { method: 'POST', body: JSON.stringify(payload) }),
  exportLogs: () => request('/api/audit/export'),
  nodes: () => request('/api/xinchuang/nodes'),
  stability: () => request('/api/xinchuang/stability'),
  users: () => request('/api/users'),
  createUser: (payload) => request('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  patchUser: (id, payload) => request(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  policies: () => request('/api/security/policies'),
  updatePolicy: (payload) => request('/api/security/policies', { method: 'PUT', body: JSON.stringify(payload) }),
  classify: (payload) => request('/api/security/classify', { method: 'POST', body: JSON.stringify(payload) }),
  configs: () => request('/api/configs'),
  updateConfig: (payload) => request('/api/configs', { method: 'PUT', body: JSON.stringify(payload) }),
}

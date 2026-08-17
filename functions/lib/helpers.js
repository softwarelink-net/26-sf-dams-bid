export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  })
}

export function clientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '192.168.1.88'
  )
}

export function nowIso() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

export function utf8FromBase64(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export function encodeToken(user) {
  return utf8ToBase64(JSON.stringify(user))
}

export function parseAuth(request) {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    const payload = JSON.parse(utf8FromBase64(header.slice(7)))
    if (!payload?.id || !payload?.role) return null
    return payload
  } catch {
    return null
  }
}

export function requireUser(request) {
  const user = parseAuth(request)
  if (!user) {
    return { user: null, error: json({ ok: false, error: '未登录或令牌失效' }, 401) }
  }
  return { user, error: null }
}

export function newId(prefix) {
  const rand = crypto.randomUUID().slice(0, 8)
  return `${prefix}_${Date.now().toString(36)}_${rand}`
}

export const LEVEL_RANK = { 公开: 0, 内部: 1, 秘密: 2, 机密: 3 }

export function canClearance(userLevel, archiveLevel) {
  return (LEVEL_RANK[userLevel] ?? 0) >= (LEVEL_RANK[archiveLevel] ?? 0)
}

export const DEMO_PASSWORDS = {
  sec_admin: 'SecAdmin@2026',
  sys_admin: 'SysAdmin@2026',
  audit_admin: 'AuditAdmin@2026',
  archivist: 'Archive@2026',
  reader: 'Reader@2026',
}

export const ROLE_LABELS = {
  sec_admin: '安全保密管理员',
  sys_admin: '系统管理员',
  audit_admin: '安全审计员',
  archivist: '档案专员',
  general_user: '普通查阅员',
}

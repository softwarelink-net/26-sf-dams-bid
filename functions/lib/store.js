import { memory } from '../lib/seed.js'
import { nowIso } from '../lib/helpers.js'

let d1Ready = null

export async function hasD1(env) {
  if (d1Ready !== null) return d1Ready
  try {
    if (!env?.DB) {
      d1Ready = false
      return false
    }
    await env.DB.prepare('SELECT id FROM users LIMIT 1').first()
    d1Ready = true
  } catch {
    d1Ready = false
  }
  return d1Ready
}

export async function writeAudit(env, entry) {
  const row = {
    id: entry.id,
    operator_id: entry.operator_id || 'anonymous',
    operator_role: entry.operator_role || 'guest',
    client_ip: entry.client_ip || '0.0.0.0',
    action_type: entry.action_type,
    resource_target: entry.resource_target || '',
    security_classification: entry.security_classification || '内部',
    status: entry.status || 'SUCCESS',
    details: entry.details || '',
    created_at: entry.created_at || nowIso(),
  }
  memory.logs.unshift(row)
  if (memory.logs.length > 400) memory.logs.length = 400

  if (await hasD1(env)) {
    try {
      await env.DB.prepare(
        `INSERT INTO audit_logs
         (id, operator_id, operator_role, client_ip, action_type, resource_target, security_classification, status, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          row.id,
          row.operator_id,
          row.operator_role,
          row.client_ip,
          row.action_type,
          row.resource_target,
          row.security_classification,
          row.status,
          row.details,
        )
        .run()
    } catch {
      /* 共享 D1 结构可能不兼容，内存存证仍有效 */
    }
  }
  return row
}

export async function listUsers(env) {
  if (await hasD1(env)) {
    try {
      const { results } = await env.DB.prepare(
        'SELECT id, username, real_name, role, security_level, ca_sn, is_active, created_at FROM users ORDER BY role',
      ).all()
      if (results?.length) return results
    } catch {
      /* fallback */
    }
  }
  return memory.users.map((u) => {
    const row = { ...u }
    delete row.password_hash
    return row
  })
}

export async function findUserByUsername(env, username) {
  if (await hasD1(env)) {
    try {
      const row = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
      if (row) return row
    } catch {
      /* fallback */
    }
  }
  return memory.users.find((u) => u.username === username) || null
}

export async function listArchives(env) {
  if (await hasD1(env)) {
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM archive_records ORDER BY created_at DESC',
      ).all()
      if (results?.length) return results
    } catch {
      /* fallback */
    }
  }
  return memory.archives
}

export async function listLogs(env) {
  if (await hasD1(env)) {
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200',
      ).all()
      if (results?.length) return results
    } catch {
      /* fallback */
    }
  }
  return memory.logs
}

export async function listNodes(env) {
  if (await hasD1(env)) {
    try {
      const { results } = await env.DB.prepare('SELECT * FROM xinchuang_nodes ORDER BY node_id').all()
      if (results?.length) {
        return results.map((n) => {
          const extra = memory.nodes.find((m) => m.node_id === n.node_id)
          return { ...extra, ...n }
        })
      }
    } catch {
      /* fallback */
    }
  }
  return memory.nodes
}

export async function listConfigs(env) {
  if (await hasD1(env)) {
    try {
      const { results } = await env.DB.prepare('SELECT * FROM system_configs').all()
      if (results?.length) return results
    } catch {
      /* fallback */
    }
  }
  return memory.configs
}

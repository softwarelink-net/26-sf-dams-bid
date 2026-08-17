import { json, requireUser, clientIp, newId } from '../../lib/helpers.js'
import { can, deny } from '../../lib/rbac.js'
import { writeAudit, listLogs } from '../../lib/store.js'

export async function handleAudit(request, env, path, method) {
  if (path === '/api/audit/logs' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'audit.read')) {
      await writeAudit(env, {
        id: newId('aud'),
        operator_id: user.id,
        operator_role: user.role,
        client_ip: clientIp(request),
        action_type: 'AUDIT_PROBE',
        resource_target: '/audit',
        security_classification: '机密',
        status: 'BLOCKED',
        details: '三员隔离：非审计员试图读取审计日志',
      })
      return json(deny(user.role, 'audit'), 403)
    }
    const logs = await listLogs(env)
    return json({ ok: true, logs, immutable: true })
  }

  if (path === '/api/audit/export' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'audit.read')) return json(deny(user.role, 'audit.export'), 403)
    const logs = await listLogs(env)
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'EXPORT',
      resource_target: 'audit_logs',
      security_classification: '机密',
      status: 'SUCCESS',
      details: `导出 ${logs.length} 条不可篡改审计记录`,
    })
    const header = 'id,operator_id,operator_role,client_ip,action_type,resource_target,security_classification,status,details,created_at'
    const lines = logs.map((l) =>
      [l.id, l.operator_id, l.operator_role, l.client_ip, l.action_type, l.resource_target, l.security_classification, l.status, `"${(l.details || '').replace(/"/g, '""')}"`, l.created_at].join(','),
    )
    const csv = [header, ...lines].join('\n')
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sf-dams-audit.csv"',
      },
    })
  }

  if (path === '/api/audit/blocked' && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    const body = await request.json().catch(() => ({}))
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'ROUTE_GUARD',
      resource_target: body.path || '',
      security_classification: '机密',
      status: 'BLOCKED',
      details: body.details || '路由守卫拦截越权访问',
    })
    return json({ ok: true })
  }

  return json({ ok: false, error: `Unknown audit route ${method} ${path}` }, 404)
}

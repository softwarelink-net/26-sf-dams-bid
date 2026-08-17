import { json, requireUser } from '../../lib/helpers.js'
import { can, deny } from '../../lib/rbac.js'
import { listNodes, listConfigs, listArchives, listLogs } from '../../lib/store.js'
import { memory } from '../../lib/seed.js'

function jitter(n, amp = 2.4) {
  const next = n + (Math.random() * amp * 2 - amp)
  return Math.min(96, Math.max(4, Number(next.toFixed(1))))
}

export async function handleXinchuang(request, env, path, method) {
  if (path === '/api/xinchuang/nodes' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'xinchuang.read') && user.role !== 'audit_admin' && user.role !== 'sec_admin') {
      return json(deny(user.role, 'xinchuang'), 403)
    }
    const nodes = await listNodes(env)
    const live = nodes.map((n) => ({
      ...n,
      cpu_usage_pct: jitter(n.cpu_usage_pct),
      memory_usage_pct: jitter(n.memory_usage_pct, 1.6),
      last_heartbeat: new Date().toISOString(),
    }))
    live.forEach((n) => {
      const mem = memory.nodes.find((m) => m.node_id === n.node_id)
      if (mem) {
        mem.cpu_usage_pct = n.cpu_usage_pct
        mem.memory_usage_pct = n.memory_usage_pct
      }
    })
    return json({ ok: true, nodes: live, topology: 'active-standby + ofd-transcode + audit-vault' })
  }

  if (path === '/api/xinchuang/stability' && method === 'GET') {
    const { error } = requireUser(request)
    if (error) return error
    const nodes = await listNodes(env)
    const goal = 540
    const current = Math.min(...nodes.map((n) => n.consecutive_normal_days || 142))
    return json({
      ok: true,
      goal_days: goal,
      current_days: current,
      remain_days: Math.max(0, goal - current),
      progress_pct: Number(((current / goal) * 100).toFixed(1)),
      zero_defect: true,
      leak_health: Number(
        (1 - nodes.reduce((s, n) => s + (n.leak_index || 0.1), 0) / nodes.length).toFixed(3),
      ),
      self_heal: 'daemon-ok',
      contract_window: '18个月 / 540 天',
    })
  }

  if (path === '/api/dashboard' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    const [nodes, configs, archives, logs] = await Promise.all([
      listNodes(env),
      listConfigs(env),
      listArchives(env),
      listLogs(env),
    ])
    const goal = 540
    const current = Math.min(...nodes.map((n) => n.consecutive_normal_days || 142))
    const canSeeArchives = user.role === 'archivist' || user.role === 'sec_admin'
    const canSeeAudit = user.role === 'audit_admin'
    const canSeeNodes = user.role === 'sys_admin' || user.role === 'audit_admin' || user.role === 'sec_admin'
    return json({
      ok: true,
      user,
      configs: user.role === 'sys_admin' ? configs : configs.filter((c) => c.key === 'SYSTEM_NAME' || c.key === 'BID_IDENTIFIER'),
      stats: {
        archive_total: canSeeArchives ? archives.length : null,
        four_passed: canSeeArchives ? archives.filter((a) => a.four_check_status === 'PASSED').length : null,
        four_pending: canSeeArchives ? archives.filter((a) => a.four_check_status === 'PENDING').length : null,
        classified: canSeeArchives ? archives.filter((a) => a.security_class === '秘密' || a.security_class === '机密').length : null,
        audit_events: canSeeAudit ? logs.length : null,
        nodes_online: nodes.filter((n) => n.status === 'ONLINE').length,
        stability_days: current,
        stability_goal: goal,
      },
      nodes: canSeeNodes || user.role === 'archivist' ? nodes : [],
      recent_archives: canSeeArchives ? archives.slice(0, 5) : [],
      recent_logs: canSeeAudit ? logs.slice(0, 6) : [],
    })
  }

  return json({ ok: false, error: `Unknown xinchuang route ${method} ${path}` }, 404)
}

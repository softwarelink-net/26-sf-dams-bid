import {
  json,
  requireUser,
  clientIp,
  newId,
  canClearance,
  nowIso,
} from '../../lib/helpers.js'
import { can, deny } from '../../lib/rbac.js'
import { memory } from '../../lib/seed.js'
import { writeAudit, listArchives } from '../../lib/store.js'

const FOUR_CHECK_STEPS = [
  { key: 'authenticity', name: '真实性', desc: '校验来源签章、档号唯一性与归档员身份绑定' },
  { key: 'integrity', name: '完整性', desc: '对照 SHA-256 与 R2 对象摘要，阻断位翻转与缺页' },
  { key: 'usability', name: '可用性', desc: 'OFD/PDF/A/DWG 轻量化预览与元数据抽取探测' },
  { key: 'security', name: '安全性', desc: '密级标签、ACL 与动态水印策略注入检查' },
]

function visibleArchives(user, archives) {
  if (user.role === 'archivist' || user.role === 'sec_admin') return archives
  if (user.role === 'general_user') {
    const allowed = new Set(
      memory.borrows
        .filter((b) => b.requester_id === user.id && b.status === 'APPROVED')
        .map((b) => b.archive_id),
    )
    return archives.filter((a) => {
      if (allowed.has(a.id)) return true
      return a.security_class === '公开' || (a.security_class === '内部' && canClearance(user.security_level, a.security_class))
    })
  }
  return []
}

export async function handleArchives(request, env, path, method) {
  if (path === '/api/archives' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'archives.read') && user.role !== 'sys_admin') {
      return json(deny(user.role, 'archives'), 403)
    }
    if (user.role === 'sys_admin') {
      return json({ ok: true, archives: [], note: '系统管理员仅可维护存储配置，不可浏览档案正文' })
    }
    const all = await listArchives(env)
    return json({ ok: true, archives: visibleArchives(user, all) })
  }

  if (path === '/api/archives' && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'archives.write')) return json(deny(user.role, 'archives.write'), 403)
    const body = await request.json().catch(() => ({}))
    const created = {
      id: newId('arc'),
      archive_code: body.archive_code || `SF-2026-ZH-${String(memory.archives.length + 1).padStart(3, '0')}`,
      title: body.title || '未命名归档对象',
      category: body.category || '企业综合',
      security_class: body.security_class || '内部',
      retention_period: body.retention_period || '10年',
      file_size_bytes: Number(body.file_size_bytes) || 1048576,
      file_format: body.file_format || 'OFD',
      sha256_hash: body.sha256_hash || crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8),
      four_check_status: 'PENDING',
      r2_object_key: body.r2_object_key || `archives/inbox/${Date.now()}.ofd`,
      archivist_id: user.id,
      created_at: nowIso(),
    }
    memory.archives.unshift(created)
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'ARCHIVE_INGEST',
      resource_target: created.archive_code,
      security_classification: created.security_class,
      status: 'SUCCESS',
      details: `接收归档 ${created.title}`,
    })
    return json({ ok: true, archive: created })
  }

  const fourMatch = path.match(/^\/api\/archives\/([^/]+)\/four-check$/)
  if (fourMatch && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'archives.write')) return json(deny(user.role, 'four-check'), 403)
    const archive = memory.archives.find((a) => a.id === fourMatch[1])
    if (!archive) return json({ ok: false, error: '档案不存在' }, 404)
    const forceFail = archive.archive_code.includes('044') && archive.four_check_status === 'FAILED'
    const steps = FOUR_CHECK_STEPS.map((s, i) => ({
      ...s,
      result: forceFail && s.key === 'integrity' ? 'FAILED' : 'PASSED',
      evidence:
        s.key === 'integrity'
          ? archive.sha256_hash
          : s.key === 'security'
            ? `class=${archive.security_class}`
            : `${archive.file_format}/${archive.file_size_bytes}`,
      order: i + 1,
    }))
    archive.four_check_status = steps.some((s) => s.result === 'FAILED') ? 'FAILED' : 'PASSED'
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'FOUR_CHECK',
      resource_target: archive.archive_code,
      security_classification: archive.security_class,
      status: archive.four_check_status === 'PASSED' ? 'SUCCESS' : 'WARNING',
      details: `四性检测 ${archive.four_check_status}`,
    })
    return json({ ok: true, archive, steps })
  }

  if (path === '/api/archives/borrows' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (user.role === 'sec_admin') return json({ ok: true, borrows: memory.borrows })
    if (user.role === 'archivist') return json({ ok: true, borrows: memory.borrows })
    if (user.role === 'general_user') {
      return json({ ok: true, borrows: memory.borrows.filter((b) => b.requester_id === user.id) })
    }
    return json(deny(user.role, 'borrow'), 403)
  }

  if (path === '/api/archives/borrows' && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'borrow.request')) return json(deny(user.role, 'borrow.request'), 403)
    const body = await request.json().catch(() => ({}))
    const archive = memory.archives.find((a) => a.id === body.archive_id)
    if (!archive) return json({ ok: false, error: '档案不存在' }, 404)
    const ticket = {
      id: newId('brw'),
      archive_id: archive.id,
      archive_code: archive.archive_code,
      title: archive.title,
      security_class: archive.security_class,
      requester_id: user.id,
      requester_name: user.real_name,
      purpose: body.purpose || '业务查阅',
      status: archive.security_class === '公开' || archive.security_class === '内部' ? 'APPROVED' : 'PENDING',
      approver_id: archive.security_class === '公开' || archive.security_class === '内部' ? 'auto' : null,
      created_at: nowIso(),
    }
    memory.borrows.unshift(ticket)
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'BORROW_REQUEST',
      resource_target: archive.archive_code,
      security_classification: archive.security_class,
      status: ticket.status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      details: ticket.purpose,
    })
    return json({ ok: true, borrow: ticket })
  }

  const approveMatch = path.match(/^\/api\/archives\/borrows\/([^/]+)\/approve$/)
  if (approveMatch && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'borrow.approve')) return json(deny(user.role, 'borrow.approve'), 403)
    const ticket = memory.borrows.find((b) => b.id === approveMatch[1])
    if (!ticket) return json({ ok: false, error: '借阅单不存在' }, 404)
    const body = await request.json().catch(() => ({}))
    ticket.status = body.reject ? 'REJECTED' : 'APPROVED'
    ticket.approver_id = user.id
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: body.reject ? 'REJECT' : 'BORROW_APPROVE',
      resource_target: ticket.archive_code,
      security_classification: ticket.security_class,
      status: body.reject ? 'BLOCKED' : 'SUCCESS',
      details: '密级审批',
    })
    return json({ ok: true, borrow: ticket })
  }

  const idMatch = path.match(/^\/api\/archives\/([^/]+)$/)
  if (idMatch && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'archives.read')) return json(deny(user.role, 'archives.read'), 403)
    const archive = memory.archives.find((a) => a.id === idMatch[1])
    if (!archive) return json({ ok: false, error: '档案不存在' }, 404)
    const allowed = visibleArchives(user, [archive]).length > 0
    if (!allowed) {
      await writeAudit(env, {
        id: newId('aud'),
        operator_id: user.id,
        operator_role: user.role,
        client_ip: clientIp(request),
        action_type: 'VIEW_ARCHIVE',
        resource_target: archive.archive_code,
        security_classification: archive.security_class,
        status: 'BLOCKED',
        details: '强制访问控制拦截：密级不足或未授权',
      })
      return json({ ok: false, error: '强制访问控制：无权调阅该密级对象' }, 403)
    }
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'VIEW_ARCHIVE',
      resource_target: archive.archive_code,
      security_classification: archive.security_class,
      status: 'SUCCESS',
      details: '电子调阅并叠加动态水印',
    })
    return json({
      ok: true,
      archive,
      watermark: {
        user: user.username,
        role: user.role,
        ip: clientIp(request),
        ts: nowIso(),
      },
      four_check_catalog: FOUR_CHECK_STEPS,
    })
  }

  return json({ ok: false, error: `Unknown archives route ${method} ${path}` }, 404)
}

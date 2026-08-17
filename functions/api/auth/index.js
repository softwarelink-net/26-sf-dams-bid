import {
  json,
  parseAuth,
  requireUser,
  encodeToken,
  clientIp,
  DEMO_PASSWORDS,
  ROLE_LABELS,
  newId,
} from '../../lib/helpers.js'
import { can, deny } from '../../lib/rbac.js'
import { memory } from '../../lib/seed.js'
import { writeAudit, findUserByUsername, listUsers, listConfigs } from '../../lib/store.js'

function publicUser(u) {
  if (!u) return null
  const rest = { ...u }
  delete rest.password_hash
  return {
    ...rest,
    role_label: ROLE_LABELS[u.role] || u.role,
  }
}

export async function handleAuth(request, env, path, method) {
  if (path === '/api/auth/login' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const username = (body.username || '').trim()
    const password = body.password || ''
    const caSn = (body.ca_sn || '').trim()

    const user = username
      ? await findUserByUsername(env, username)
      : memory.users.find((u) => u.ca_sn === caSn)

    if (!user || !user.is_active) {
      await writeAudit(env, {
        id: newId('aud'),
        operator_id: 'anonymous',
        operator_role: 'guest',
        client_ip: clientIp(request),
        action_type: 'LOGIN',
        resource_target: username || caSn || 'unknown',
        status: 'BLOCKED',
        details: '账号不存在或已停用',
      })
      return json({ ok: false, error: '账号不存在或已停用' }, 401)
    }

    const expected = DEMO_PASSWORDS[user.username]
    const passOk = caSn ? user.ca_sn === caSn : expected && expected === password
    if (!passOk) {
      await writeAudit(env, {
        id: newId('aud'),
        operator_id: user.id,
        operator_role: user.role,
        client_ip: clientIp(request),
        action_type: 'LOGIN',
        resource_target: user.username,
        status: 'BLOCKED',
        details: '口令或 CA 证书校验失败',
      })
      return json({ ok: false, error: '口令或 CA 证书校验失败' }, 401)
    }

    const session = publicUser(user)
    session.client_ip = clientIp(request)
    const token = encodeToken(session)
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: session.client_ip,
      action_type: 'LOGIN',
      resource_target: user.username,
      status: 'SUCCESS',
      details: caSn ? `CA 证书登录 ${user.ca_sn}` : '口令登录成功',
    })
    return json({ ok: true, token, user: session })
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    return json({ ok: true, user: { ...user, client_ip: clientIp(request) } })
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const user = parseAuth(request)
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user?.id || 'anonymous',
      operator_role: user?.role || 'guest',
      client_ip: clientIp(request),
      action_type: 'LOGOUT',
      resource_target: user?.username || '',
      status: 'SUCCESS',
      details: '会话注销',
    })
    return json({ ok: true })
  }

  if (path === '/api/auth/switch-role' && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    const body = await request.json().catch(() => ({}))
    const target = memory.users.find((u) => u.role === body.role && u.is_active)
    if (!target) return json({ ok: false, error: '目标角色不存在' }, 400)
    const session = publicUser(target)
    session.client_ip = clientIp(request)
    session.switched_from = user.role
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: session.client_ip,
      action_type: 'ROLE_SWITCH',
      resource_target: target.role,
      security_classification: '机密',
      status: 'WARNING',
      details: `演示三员切换 ${user.role} → ${target.role}`,
    })
    return json({ ok: true, token: encodeToken(session), user: session })
  }

  if (path === '/api/users' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'users.read')) return json(deny(user.role, 'users'), 403)
    const users = await listUsers(env)
    const payload = user.role === 'sec_admin' ? users.map((u) => ({
      id: u.id,
      username: u.username,
      real_name: u.real_name,
      role: u.role,
      security_level: u.security_level,
      is_active: u.is_active,
    })) : users
    return json({ ok: true, users: payload })
  }

  if (path === '/api/users' && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'users.write')) return json(deny(user.role, 'users.write'), 403)
    const body = await request.json().catch(() => ({}))
    if (!body.username || !body.real_name || !body.role) {
      return json({ ok: false, error: '缺少用户字段' }, 400)
    }
    if (memory.users.some((u) => u.username === body.username)) {
      return json({ ok: false, error: '账号已存在' }, 409)
    }
    const created = {
      id: newId('u'),
      username: body.username,
      password_hash: 'pbkdf2_new_2026',
      real_name: body.real_name,
      role: body.role,
      security_level: body.security_level || '内部',
      ca_sn: body.ca_sn || `CA-NEW-${Date.now().toString(36).toUpperCase()}`,
      is_active: 1,
      created_at: new Date().toISOString(),
    }
    memory.users.push(created)
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'USER_CREATE',
      resource_target: created.username,
      status: 'SUCCESS',
      details: `开户 ${created.real_name} / ${created.role}`,
    })
    return json({ ok: true, user: publicUser(created) })
  }

  if (path.startsWith('/api/users/') && method === 'PATCH') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'users.write')) return json(deny(user.role, 'users.write'), 403)
    const id = path.split('/').pop()
    const target = memory.users.find((u) => u.id === id)
    if (!target) return json({ ok: false, error: '用户不存在' }, 404)
    const body = await request.json().catch(() => ({}))
    if (typeof body.is_active === 'number') target.is_active = body.is_active
    if (body.security_level) return json({ ok: false, error: '系统管理员不可提权或改密级，请由安全保密员执行' }, 403)
    if (body.role && body.role !== target.role) {
      return json({ ok: false, error: '系统管理员不可提权，角色变更须由安全保密员审批' }, 403)
    }
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'USER_UPDATE',
      resource_target: target.username,
      status: 'SUCCESS',
      details: '更新用户状态',
    })
    return json({ ok: true, user: publicUser(target) })
  }

  if (path === '/api/security/policies' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (user.role !== 'sec_admin') return json(deny(user.role, 'security'), 403)
    return json({ ok: true, policies: memory.policies })
  }

  if (path === '/api/security/policies' && method === 'PUT') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'security.write')) return json(deny(user.role, 'security.write'), 403)
    const body = await request.json().catch(() => ({}))
    const policy = memory.policies.find((p) => p.id === body.id)
    if (!policy) return json({ ok: false, error: '策略不存在' }, 404)
    if (typeof body.enabled === 'boolean') policy.enabled = body.enabled
    if (body.value) policy.value = body.value
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'SECURITY_CONFIG',
      resource_target: policy.name,
      security_classification: '机密',
      status: 'SUCCESS',
      details: `策略变更 enabled=${policy.enabled} value=${policy.value}`,
    })
    return json({ ok: true, policy })
  }

  if (path === '/api/security/classify' && method === 'POST') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (user.role !== 'sec_admin') return json(deny(user.role, 'classify'), 403)
    const body = await request.json().catch(() => ({}))
    const archive = memory.archives.find((a) => a.id === body.archive_id)
    if (!archive) return json({ ok: false, error: '档案不存在' }, 404)
    const prev = archive.security_class
    archive.security_class = body.security_class
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'SECURITY_CONFIG',
      resource_target: archive.archive_code,
      security_classification: archive.security_class,
      status: 'SUCCESS',
      details: `定密调整 ${prev} → ${archive.security_class}`,
    })
    return json({ ok: true, archive })
  }

  if (path === '/api/configs' && method === 'GET') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (user.role !== 'sys_admin') return json(deny(user.role, 'configs'), 403)
    const configs = await listConfigs(env)
    return json({ ok: true, configs })
  }

  if (path === '/api/configs' && method === 'PUT') {
    const { user, error } = requireUser(request)
    if (error) return error
    if (!can(user.role, 'configs.write')) return json(deny(user.role, 'configs.write'), 403)
    const body = await request.json().catch(() => ({}))
    const row = memory.configs.find((c) => c.key === body.key)
    if (!row) return json({ ok: false, error: '配置项不存在' }, 404)
    row.value = String(body.value ?? row.value)
    await writeAudit(env, {
      id: newId('aud'),
      operator_id: user.id,
      operator_role: user.role,
      client_ip: clientIp(request),
      action_type: 'CONFIG_UPDATE',
      resource_target: row.key,
      status: 'SUCCESS',
      details: `更新 ${row.key}=${row.value}`,
    })
    return json({ ok: true, config: row })
  }

  return json({ ok: false, error: `Unknown auth route ${method} ${path}` }, 404)
}

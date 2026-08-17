/** 三员分立 + 业务角色权限矩阵 */

export const ROUTE_ROLES = {
  dashboard: ['sec_admin', 'sys_admin', 'audit_admin', 'archivist', 'general_user'],
  archives: ['archivist'],
  borrow: ['sec_admin', 'archivist', 'general_user'],
  audit: ['audit_admin'],
  users: ['sys_admin', 'sec_admin'],
  security: ['sec_admin'],
  xinchuang: ['sys_admin'],
  configs: ['sys_admin'],
}

export const API_PERMISSIONS = {
  'users.read': ['sys_admin', 'sec_admin'],
  'users.write': ['sys_admin'],
  'security.write': ['sec_admin'],
  'audit.read': ['audit_admin'],
  'archives.write': ['archivist'],
  'archives.read': ['archivist', 'sec_admin', 'general_user'],
  'borrow.approve': ['sec_admin'],
  'borrow.request': ['archivist', 'general_user'],
  'xinchuang.read': ['sys_admin'],
  'configs.write': ['sys_admin'],
}

export function can(role, permission) {
  return (API_PERMISSIONS[permission] || []).includes(role)
}

export function deny(role, resource) {
  return {
    ok: false,
    error: '三员隔离：当前角色无权访问该资源',
    role,
    resource,
    code: 'THREE_ROLE_ISOLATION',
  }
}

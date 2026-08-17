-- Cloudflare D1 Schema for Shaanxi Aircraft Industry DAMS

-- 1. Users Table (三员体系与业务人员)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('sec_admin', 'sys_admin', 'audit_admin', 'archivist', 'general_user')),
    security_level TEXT NOT NULL DEFAULT '内部' CHECK(security_level IN ('公开', '内部', '秘密', '机密')),
    ca_sn TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. System Configurations & Feature Flags
CREATE TABLE IF NOT EXISTS system_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted INTEGER DEFAULT 0,
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Digital Archive Assets (档案元数据与全周期状态)
CREATE TABLE IF NOT EXISTS archive_records (
    id TEXT PRIMARY KEY,
    archive_code TEXT UNIQUE NOT NULL, -- 档号 (e.g., SF-2026-GC-001)
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('研发图纸', '工艺规程', '质量试验', '企业综合', '设备档案')),
    security_class TEXT NOT NULL CHECK(security_class IN ('公开', '内部', '秘密', '机密')),
    retention_period TEXT NOT NULL CHECK(retention_period IN ('10年', '30年', '永久')),
    file_size_bytes INTEGER NOT NULL,
    file_format TEXT NOT NULL, -- OFD, PDF/A, DWG, CATPart
    sha256_hash TEXT NOT NULL, -- 防篡改完整性哈希
    four_check_status TEXT NOT NULL DEFAULT 'PASSED' CHECK(four_check_status IN ('PENDING', 'PASSED', 'FAILED')),
    r2_object_key TEXT NOT NULL,
    archivist_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(archivist_id) REFERENCES users(id)
);

-- 4. Three-Role Immutable Audit Logs (安全审计日志)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    operator_id TEXT NOT NULL,
    operator_role TEXT NOT NULL,
    client_ip TEXT NOT NULL,
    action_type TEXT NOT NULL, -- LOGIN, VIEW_ARCHIVE, EXPORT, SECURITY_CONFIG, REJECT
    resource_target TEXT,
    security_classification TEXT,
    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'WARNING', 'BLOCKED')),
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Xinchuang Server Fleet Telemetry (4台信创服务器监控)
CREATE TABLE IF NOT EXISTS xinchuang_nodes (
    node_id TEXT PRIMARY KEY,
    node_name TEXT NOT NULL,
    cpu_arch TEXT NOT NULL, -- 飞腾 FT-2000+ / 鲲鹏 920
    os_name TEXT NOT NULL,  -- 银河麒麟 V10 / 统信 UOS V20
    ip_address TEXT NOT NULL,
    cpu_usage_pct REAL NOT NULL DEFAULT 0.0,
    memory_usage_pct REAL NOT NULL DEFAULT 0.0,
    storage_usage_pct REAL NOT NULL DEFAULT 0.0,
    consecutive_normal_days INTEGER NOT NULL DEFAULT 120, -- 18个月(540天)稳定性跟踪
    status TEXT NOT NULL CHECK(status IN ('ONLINE', 'WARNING', 'OFFLINE')),
    last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed Users
INSERT OR REPLACE INTO users (id, username, password_hash, real_name, role, security_level, ca_sn) VALUES
('u_sec', 'sec_admin', 'pbkdf2_sec_2026', '赵安保 (安全保密员)', 'sec_admin', '机密', 'CA-SEC-998811'),
('u_sys', 'sys_admin', 'pbkdf2_sys_2026', '钱运维 (系统管理员)', 'sys_admin', '机密', 'CA-SYS-998822'),
('u_aud', 'audit_admin', 'pbkdf2_aud_2026', '孙审计 (安全审计员)', 'audit_admin', '机密', 'CA-AUD-998833'),
('u_arc', 'archivist', 'pbkdf2_arc_2026', '李档案 (主责归档员)', 'archivist', '秘密', 'CA-ARC-998844');

-- Seed System Configs
INSERT OR REPLACE INTO system_configs (key, value, description) VALUES
('SYSTEM_NAME', '陕飞工业数字档案管理协同系统 (信创涉密版)', '系统中文全称'),
('BID_IDENTIFIER', '0730-2611010525/01', '标讯项目备案号'),
('CLASSIFIED_PROTECTION_LEVEL', '三级等保/涉密分级保护 (机密级)', '分保等级要求'),
('18_MONTH_ZERO_DEFECT_GOAL', '540', '18个月零缺陷达标周期天数');

-- Seed Xinchuang Server Nodes (4台信创服务器)
INSERT OR REPLACE INTO xinchuang_nodes (node_id, node_name, cpu_arch, os_name, ip_address, cpu_usage_pct, memory_usage_pct, storage_usage_pct, consecutive_normal_days, status) VALUES
('XC-NODE-01', '陕飞档案主应用服务节点 A', '鲲鹏 920 (64核)', '银河麒麟 Server V10', '192.168.10.101', 28.4, 45.2, 38.1, 142, 'ONLINE'),
('XC-NODE-02', '陕飞档案高可用备用节点 B', '鲲鹏 920 (64核)', '银河麒麟 Server V10', '192.168.10.102', 14.1, 32.8, 38.1, 142, 'ONLINE'),
('XC-NODE-03', '信创四性检测与OFD转码节点', '飞腾 Tengyun S2500', '统信 UOS Server V20', '192.168.10.103', 62.7, 71.5, 54.0, 142, 'ONLINE'),
('XC-NODE-04', '涉密加密存储与不可篡改审计节点', '海光 Hygon C86-3G', '银河麒麟 Server V10', '192.168.10.104', 19.8, 41.0, 29.3, 142, 'ONLINE');

-- Seed Demo Archives
INSERT OR REPLACE INTO archive_records (id, archive_code, title, category, security_class, retention_period, file_size_bytes, file_format, sha256_hash, four_check_status, r2_object_key, archivist_id) VALUES
('arc_01', 'SF-2026-YF-运9-001', '运-9系列机翼复合材料结构疲劳应力分析报告', '研发图纸', '机密', '永久', 48291040, 'OFD', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'PASSED', 'archives/yf/y9_wing_stress_2026.ofd', 'u_arc'),
('arc_02', 'SF-2026-GY-陕飞-089', '某型特种机总装脉动生产线工艺流程卡', '工艺规程', '秘密', '30年', 18451200, 'PDF/A', 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2', 'PASSED', 'archives/gy/assembly_proc_card.pdf', 'u_arc'),
('arc_03', 'SF-2026-ZL-试验-034', '数字化起落架液压作动器高低温环控测试原始记录', '质量试验', '内部', '10年', 8392100, 'OFD', '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', 'PASSED', 'archives/zl/landing_gear_env_test.ofd', 'u_arc');

-- Seed Audit Trail
INSERT OR REPLACE INTO audit_logs (id, operator_id, operator_role, client_ip, action_type, resource_target, security_classification, status, details) VALUES
('aud_001', 'u_sec', 'sec_admin', '192.168.1.15', 'SECURITY_CONFIG', '密级访问控制策略表', '机密', 'SUCCESS', '更新机密级文件调阅审批双人复核门槛'),
('aud_002', 'u_arc', 'archivist', '192.168.1.28', 'VIEW_ARCHIVE', 'SF-2026-YF-运9-001', '机密', 'SUCCESS', '电子档案密级水印动态载入并调阅');

# 陕西飞机工业有限责任公司 - 数字档案管理系统 (26-sf-dams-bid)

- **Host 部署主域名**: [https://26-sf-dams-bid.softwarelink.net/](https://26-sf-dams-bid.softwarelink.net/)
- **Repository 代码仓库**: [https://github.com/softwarelink-net/26-sf-dams-bid](https://github.com/softwarelink-net/26-sf-dams-bid)
- **Dashboard 预览图路径**: `docs/assets/dashboard-preview.png`

---

## 部署与运行说明

### 1. 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0
- Wrangler CLI >= 3.0.0 (Cloudflare CLI)

### 2. 安装依赖
```bash
npm install
```

### 3. 本地运行 (Allworld / Workers 模式)
```bash
# 启动本地前端 Vite 开发服务器与 Workers 模拟环境
npm run dev
```

### 4. 演示账号矩阵 (满足三员分立规范)
| 角色名称 | 登录账号 | 默认密码 | 职能范围 |
| :--- | :--- | :--- | :--- |
| 安全保密管理员 | `sec_admin` | `SecAdmin@2026` | 权限授权、安全策略、密级调整与定密审批 |
| 系统管理员 | `sys_admin` | `SysAdmin@2026` | 用户开户、参数配置、信创服务器集群监控 |
| 安全审计员 | `audit_admin` | `AuditAdmin@2026` | 全局无死角安全审计追踪、异常告警与日志导出 |
| 档案专员 | `archivist` | `Archive@2026` | 档案“收管存用”全生命周期作业与四性检测 |

### 5. 生产构建
```bash
npm run build
```

### 6. 部署到 Cloudflare (Workers 模式，严禁 Pages)
```bash
# 执行自动化打包并发布至 Cloudflare Workers
npm run deploy
```

### 7. 常用脚本一览
- `npm run dev`: 本地开发调试
- `npm run build`: 生产产物编译
- `npm run db:migrate`: Cloudflare D1 数据库架构迁移
- `npm run db:seed`: 注入默认密级策略与模拟测试档案

### 8. 目录结构
```text
26-sf-dams-bid/
├── src/
│   ├── assets/             # 静态资产与样式
│   ├── components/         # 全局通用组件 (StickyTopBanner, WatermarkOverlay)
│   ├── layouts/            # AuthLayout, MainLayout (含三员模式切换)
│   ├── router/             # Vue Router 配置与路由守卫
│   ├── stores/             # Pinia 状态库 (用户、权限、密级、监控)
│   ├── views/              # 业务页面 (Dashboard, ArchiveManage, AuditLog, BidDetail)
│   ├── App.vue
│   └── main.js
├── functions/              # Cloudflare Workers API 路由与业务逻辑
│   ├── api/
│   │   ├── auth/           # 认证与令牌颁发
│   │   ├── archives/       # 档案 CRUD 与四性检测流水线
│   │   ├── audit/          # 审计日志上报与不可篡改存证
│   │   └── xinchuang/      # 信创 4 节点硬件监控指标采集
│   └── [[path]].js         # Workers API 网关分发
├── schema.sql              # Cloudflare D1 建表与种子数据脚本
├── wrangler.toml           # Cloudflare Workers 配置
├── index.html              # SEO Meta 注入入口
├── vite.config.js
└── package.json
```

---

## 招标公告全文

### 1. 标题
数字档案管理系统招标公告

### 2. 项目发包方
陕西飞机工业有限责任公司

### 3. 项目编号
0730-2611010525/01

### 4. 项目发布时间
2026/08/13 18:06:21

### 5. 关键词
陕西飞机工业有限责任公司, 陕飞招标, 数字档案管理系统, 信创替代, 涉密信息系统集成, 0730-2611010525/01, 汉中招标, 航空工业

### 6. 摘要
陕西飞机工业有限责任公司发布数字档案管理系统采购招标公告，需满足涉密分保与信创改造要求并含4台服务器，投标截止2026年9月4日。

### 7. 技术要点
- **B/S 架构设计**：采用具备高可靠性、稳定性与易扩展性的 B/S 分布式架构。
- **涉密分级保护合规**：全面遵循国家最新分保规范，落地密级标识、强制访问控制、“三员分立”管理、高强度身份鉴别与防篡改审计日志。
- **软硬一体信创适配改造**：包含配套的 4 台信创专用服务器软硬件深度适配，支持纯国产环境平稳运行。
- **18 个月超长无缺陷验证**：项目合同签订后需在 18 个月内无软件功能和逻辑问题发生方可最终通过验收。

### 8. 技术创新性
- **全链路密级标签与零信任数据沙箱**：档案资产全生命周期附带多维密级安全元数据与动态人员水印防泄密。
- **轻量化微服务/Serverless 高并发响应**：结合 Cloudflare 边缘计算与 D1/R2 体系，实现毫秒级档案元数据检索与大文件流式存储。
- **信创服务器集群健康感知引擎**：实时监测 4 节点信创服务器计算资源与数据吞吐，提供长效稳定性预测保障。

---

## 免责声明

1. **数据来源与合规性**：本系统展示的所有招标信息、项目背景及采购需求均来源于公开招投标平台（如中国招标投标公共服务平台、中国建设银行龙集采平台等）。系统仅用于技术方案演示、架构原型验证与演示搭建，不涉及任何商业非法抓取或数据篡改。
2. **技术实现路径**：本系统前端基于 Vue 3 + Tailwind CSS 构建，后端基于 Cloudflare Workers 极简无服务器架构，数据存储采用 Cloudflare D1 关系型数据库，完整符合分布式高可用与银企对接安全标准。
3. **保密承诺**：开发团队严格遵守保密义务，系统内示例数据均经过伪化脱敏处理（Anonymized），不包含真实患者医疗健康信息（PHI）或建行敏感金融交易数据。
4. **知识产权与巧合声明**：本系统中涉及的商标、机构名称（中国建设银行、川北医学院附属医院等）归各自合法持有人所有。演示代码与系统架构若与实际投产系统存在相似之处，纯属技术通用设计之巧合。
5. **免责条款**：本演示系统不具备实际金融扣款功能，不承担因非授权使用、不可抗力或第三方平台接口变更所导致的任何法律责任与经济损失。

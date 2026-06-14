# 交接 · 登录页优化与用户可见文案审查 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:27:45+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: sap-jp.training 登录页 UI/UX 优化，以及全站用户无意义/内部化文案审查

## 本轮完成

- 将 `/login` 从左右两个独立白色卡片改为一个统一登录面板：桌面端左右分栏、移动端收紧说明内容并优先保证登录表单进入首屏。
- 保留原有登录、注册、邀请码、密码显示/隐藏、表单校验与登录后跳转调用方式；未改 auth、RBAC、录音、学生数据、生产配置或 DB migration。
- 从登录页删除 `角色隔离`、`登录后分流` 以及同类内部权限/路由说明。
- 登录页改为面向真实学员、讲师、管理员的操作提示：登录、注册、邀请码、课程/录音/笔记/老师反馈入口。
- 写入中文审查文档：`projects/4-sap-training/docs/user-facing-content-audit-20260522.md`。
- 更新 Project 4 state：`projects/4-sap-training/state/sap_jp_training_course.json`。

## 修改文件

- `projects/4-sap-training/web/app/login/LoginClient.tsx`
- `projects/4-sap-training/docs/user-facing-content-audit-20260522.md`
- `projects/4-sap-training/state/sap_jp_training_course.json`
- `projects/4-sap-training/inbox/handoff-login-content-audit-20260522.md`

## 审查结果概览

- `fixed`：3 项，均为登录页本轮已实际删除/改写。
- `needs_user_decision`：8 项，主要在首页版本说明、课程资料内部 label、讲师页 Phase/MVP 词、作业本地保存状态。
- `keep`：2 项，主要是 admin-only 运维信息和隐私政策中的服务商透明度。
- `pending`：1 项，未被当前页面引用的旧讲师录音组件；未来若重新启用应先重写文案。

## 验证

- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：PASS；仍有既有 Sentry/OpenTelemetry critical dependency warning 与 pg SSL-mode warning，未发现本轮新增 build error。
- 本地 dev server：`REGISTRATION_INVITE_CODE=dev-invite npm run dev -- --hostname 127.0.0.1 --port 3214`。
- 浏览器桌面端 `/login`：PASS，统一面板可见；登录表单可见；无横向溢出；`角色隔离`/`登录后分流` 不出现。
- 浏览器移动端 390x844 `/login`：PASS，登录输入区进入首屏；无横向溢出；`角色隔离`/`登录后分流` 不出现。
- 注册表单 smoke：PASS，注册 tab 可点击；邮箱、用户名、显示名称、邀请码、密码、确认密码、隐私确认和“注册并进入”均可见。
- 密码显示/隐藏 smoke：PASS，注册页密码显示按钮可切换密码输入类型。

## 预览

- 本地预览地址：`http://127.0.0.1:3214/login`
- 桌面截图：`/tmp/sap-login-desktop-20260522.png`
- 移动截图：`/tmp/sap-login-mobile-20260522.png`

## 未做 / 停手点

- 未删除其它页面的内部化文案；审查文档中标为 `needs_user_decision`，等待 Ryan 确认后再分批改。
- 未触碰 auth、RBAC、录音 API、学生数据、生产配置、数据库 migration。
- 未 push、未部署、未 merge PR。

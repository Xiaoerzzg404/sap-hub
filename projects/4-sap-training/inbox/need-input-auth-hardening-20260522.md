# 需确认 · 注册与账号认领加固 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:05:00+09:00
- status: partially_answered_for_current_branch

## 为什么需要确认

审查 `handoff-auth-credentials-roles-20260522.md` 时发现：公开注册不能直接负责 owner 初始化，也不能让历史无密码账号通过知道邮箱就设置密码。代码已改为 fail-closed，但生产上线前需要 Ryan 决定并配置对应环境变量。

## 需要 Ryan 确认

本轮 Ryan 已确认允许继续 push/PR、R2/CDN、Neon 0003 migration、创建 smoke 测试账号和 authenticated smoke。仍需 Ryan 在 Vercel/运营侧决定并配置以下生产 env；Codex 本轮未生成、未打印、未写入这些 token 值：

1. `REGISTRATION_INVITE_CODE`：生产环境是否使用邀请码控制学生注册？若允许，请在 Vercel Production env 配置该 key，并决定发给哪些 beta 学员。
2. `OWNER_BOOTSTRAP_TOKEN`：是否允许用一次性 token 初始化 owner 密码？使用后请轮换或删除。
3. `ACCOUNT_CLAIM_TOKEN`：是否有历史 magic-link / 无密码账号需要设置密码？如有，请临时配置一次性 token，只发给对应本人，完成后轮换或删除。
4. 测试账号：请确认一个 student、teacher、admin 测试账号，或确认允许本地创建测试账号并写入测试 DB。

## 停手规则

仍然停手：不生成或打印任何 token，不把 token 写入文档或 Git，不发送真实邮件，不接管真实账号，不读取 magic-link token 或 session cookie。生产 merge/deploy 需等 `REGISTRATION_INVITE_CODE` 与课程音频 CDN base URL 等生产环境阻塞确认完成。

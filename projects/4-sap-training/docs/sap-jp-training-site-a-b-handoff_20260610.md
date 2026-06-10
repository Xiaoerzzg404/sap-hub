# SAP 日语训练站 A/B 双版本交接说明

- updated_by: codex
- updated_at: 2026-06-10T11:05:00+09:00
- status: handoff_ready

---

## 1. 这份文档是给谁的

给后续接手本项目的 Claude / Codex / 其他 agent。

目标不是解释抽象愿景，而是把 **SAP 日语训练站 A 版与 B 版当前各自是什么、现在到哪一步、差异在哪里、后面该怎么继续** 说清楚，让接手者可以直接进入执行。

---

## 2. A 版和 B 版分别是什么

### A 版：本地开发中的升级版

- 本地路径：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web`
- 当前本地入口：`http://127.0.0.1:3214/`
- 当前运行形态：本地 dev server
- 当前已知运行会话：`screen` detached 会话 `sap-jp-training-3214`
- 日志：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/logs/sap-jp-training-dev-3214.log`

**定位**：
A 版不是简单修补，而是已经明显升级过的一套训练平台。它承载的是 Project 4 未来应该继续演进的主站能力。

### B 版：已经公开发布过的公网版

- 实测有效公网地址：`https://sap-jp.training`
- 用户口述里的 `sap-jp.trainning` 当前不可解析，不能当真相源
- 本地静态备份路径：
  `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/sap-jp-training-public-backup/`
- 本地查看入口：
  `http://127.0.0.1:7788/sap-jp-training-public-backup/index.html`

**定位**：
B 版代表“已经对外出现过的旧公开面貌”。它适合作为：

1. 公网版本快照；
2. UI/文案/信息架构的历史参考；
3. A 版继续开发时的回退参照；
4. Claude 接手时的对照样本。

---

## 3. A/B 的关系，不要搞反

正确理解是：

- **A = 主开发线 / 升级线 / 未来线**
- **B = 已发布旧线 / 对外历史线 / 备份线**

不是：

- A 和 B 两套并行产品长期双维护；
- B 是 A 的完整替代；
- B 备份可以代替真实生产后端。

因此，后续 Claude 接手时默认策略应该是：

- **继续把新功能做在 A 上**
- **把 B 当对照、回看、备份和兜底**
- 只有在用户明确要求时，才讨论是否把 A 推到公网替换 B

---

## 4. 为什么说 A 已经比 B 升级很多

根据本轮检查与现有交接，A 相对 B 至少已经有以下升级方向：

### 4.1 学习交互更完整

- 不只是静态课程展示；
- 已有更完整的训练型学习流，而不是单纯内容陈列；
- 课程步骤、练习、提交、跟进更像“训练平台”。

### 4.2 录音相关能力更重

- 有大量录音/音频资产接入；
- 平台围绕“听、跟读、录音、复盘”做了明显增强；
- 录音不是点缀，而是核心产品能力的一部分。

### 4.3 验证与权限边界更清楚

- 当前首页访问会进入登录墙；
- `/login` 可访问，说明 A 已经带有更明确的账户/权限边界；
- 历史 state 已记录过注册、登录、角色、admin 等一整轮演进。

### 4.4 UI 已经不是早期展示站级别

- A 版不是一个轻量静态展示页；
- 它有独立的页面结构、登录逻辑、学习页、教师/学员/管理相关面；
- 整体更接近产品化平台，而不是单页官网。

---

## 5. B 版当前真实价值是什么

B 版不要被低估，它对接手者有四个具体价值：

### 5.1 它是公网历史真相

如果 Claude 需要知道“用户现在外面已经给别人看到过什么”，B 是最近的公开参照。

### 5.2 它是文案与结构对照面

当 A 的某些页面继续改造时，可以对照 B 的：

- 首页表达
- 栏目组织
- 课程入口
- 页面节奏
- 对外定位

### 5.3 它是本地备份

本轮已经把 B 做成了本地静态备份，至少保证：

- 公网页面可以在本机继续查看；
- 即使外部站点临时变化，也保留一份本地样本；
- Claude 可以脱离公网，快速理解旧站长相。

### 5.4 它是 Insight Desk 的一个可直接打开的页签

现在用户在本机 SAP Insight Desk 里，已经可以一键打开 B 备份，不用再回忆公网地址。

---

## 6. 本轮已经完成的状态

### 6.1 A 已接入本机 Insight Desk

本机入口：

- `http://127.0.0.1:3214/`

在 Insight Desk 主入口及多个主分站导航中，已加入：

- `日语A本地`

### 6.2 B 已接入本机 Insight Desk

本机入口：

- `http://127.0.0.1:7788/sap-jp-training-public-backup/index.html`

在 Insight Desk 主入口及多个主分站导航中，已加入：

- `日语B备份`

### 6.3 B 的本地备份已生成

备份目录：

- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/sap-jp-training-public-backup/`

抓取结果摘要：

- 路由尝试 18
- 路由成功 17
- `_next` 静态资源发现 10
- `_next` 静态资源成功 10
- `/admin` 公网返回 404，已诚实记录

### 6.4 已知验证结论

- `https://sap-jp.training` 可达，HTTP 200
- `https://sap-jp.trainning` 不可解析
- A 当前根路径会跳登录页，符合现状
- B 本地备份页面可打开，静态资源可加载

---

## 7. 对 Claude 最重要的“当前判断”

### 判断一：A 才是今后继续完善的主战场

后续如果要补功能、补体验、补训练闭环，默认应该继续在 `web/` 里推进 A。

### 判断二：B 不该被继续当主开发分支

B 是公网历史版，不适合继续拿来直接开发。最多：

- 看结构；
- 抄对外表达；
- 做差异对照；
- 保留备份。

### 判断三：当前不要把“备份”误写成“生产可替代版本”

B 的本地备份只是静态快照，不包含真实动态能力。它不能代替：

- 登录态后端
- 数据库
- 上传/录音写入
- 权限判定
- 实时 API

### 判断四：接手时要分清“本地接入完成”与“公网发布完成”

本轮完成的是：

- 本地双入口整合；
- 本地备份；
- 本地可访问；
- 项目状态记录。

本轮没有完成的是：

- A 发布到公网；
- A 替换 B；
- 生产环境变量调整；
- 真实生产验证闭环。

---

## 8. Claude 接手后优先建议怎么继续

建议顺序：

### 第一步：先把 A 的当前能力盘清楚

从 `web/` 开始，重点确认：

- 课程数据结构
- 登录/注册/角色边界
- lesson 页面结构
- 音频与录音链路
- teacher/admin 相关页面
- 当前哪些功能只在本地可用

### 第二步：把 A 与 B 的差异写成显式清单

不是笼统说“升级很多”，而是整理成：

- 页面差异
- 功能差异
- 数据差异
- 权限差异
- UI 差异
- 未完成项差异

这样以后不管是继续开发、对外说明还是决定是否替换公网，都会更稳。

### 第三步：以 A 为主线补完产品闭环

优先看这些是否完整：

- 试听到正式学习的路径
- 课程进度记录
- 跟读/录音/提交/反馈闭环
- 学员端与教师端的分工
- library / assets / admin 的边界

### 第四步：只有在用户明确批准时，才推进公网替换

如果以后用户要把 A 推到公网，应先补：

- 部署说明
- 环境变量清单
- 数据迁移边界
- 生产 smoke checklist
- 回滚方案

---

## 9. 与 Insight Desk 的关系

本轮之后，A/B 已经不是孤立站点，而是被纳入本机 SAP Insight Desk 工作台：

- SAP 控制台
- sap 干货
- sap 档案
- sap 素材库
- sap 已发布
- 主入口页

这些主分站顶栏里都已有：

- `日语A本地`
- `日语B备份`

这意味着后续 Claude 接手网站工作时，应该默认把它当成 **Insight Desk 体系内的一块能力分站**，而不是单独漂在外面的孤站。

---

## 10. 接手时必须先看的文件

建议顺序：

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/AGENT_GUARDRAILS.md`
3. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`
4. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/CLAUDE.md`
5. 本文档
6. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/state/sap_jp_training_course.json`
7. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/handoff-insight-desk-training-sites-20260610.md`

如果涉及 Insight Desk 页签本身，再看：

- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/HANDOFF.md`

---

## 11. 建议 Claude 后续输出什么样的交接

后续凡是继续推进 A/B 网站相关工作，建议都至少产出：

1. 一份 `inbox/handoff-*.md`
2. `state/sap_jp_training_course.json` 的对应更新
3. 如涉及网站结构变化，再补一份 `docs/` 专题文档

推荐专题文档题目示例：

- `A_B_feature_gap_*.md`
- `A_upgrade_deploy_readiness_*.md`
- `recording_flow_audit_*.md`
- `auth_role_boundary_*.md`

---

## 12. 一句话总结

**A 是未来，B 是历史；A 继续开发，B 保留对照；本轮已经把二者都接进本机 Insight Desk，并把 B 做成了可直接打开的本地备份。**

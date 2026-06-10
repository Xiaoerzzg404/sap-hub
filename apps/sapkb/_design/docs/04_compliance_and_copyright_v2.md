# 04｜合规与版权 v2

> 本节是系统的法律护城河。继承 v1 三条红线，新增**已购授权凭证机制**，并补上**中国著作权法 / 日本著作権法**的双语境提示。
> 我不是律师，下面是“一般会怎么主张 + 争议点”，不替你下不可逆的法律结论；商用前请过你的法务/税理士相关判断。

## 一、三条硬性红线（不可逾越）

1. 不存任何平台账号密码、不模拟登录、不读浏览器 Cookie、不绕验证码/短信/二维码/风控。
2. 不批量下载/搬运/公开转载他人未授权全文；不抓付费/会员/私密/群聊/朋友圈/登录后内容（除非你已购授权，见第三节）。
3. 不删除版权声明/作者/来源；不把他人文章改写后冒充原创发布。

## 二、平台条款核实机制（v3：快照制，不写死条款编号）

平台条款随时改版，设计稿写死"第 X.X 条"会过时、且出事时无法自证当时核实过。v3 改为：

1. **核实即存快照**：每次核实平台条款，把条款页面整页存档到
   `SAP_EXTKB/_sources/tos_snapshots/<平台>_<日期>.pdf|html`（与 FUZHKB 的 `_sources/` 证据模式一致）。
2. 设计/合规文档只引用快照文件名，不引用条款编号。
3. **复核节奏**：每季度复核一次；任一平台条款变更导致采集姿态需收紧的，先停该源再改 policy。

按既往核实的共识姿态（以快照为准）：CSDN/知乎/公众号的平台内容知识产权归原权利人，
未经授权不得转载/摘编/下载使用。

→ 推论（保守姿态）：
- 默认只存**标题/链接/作者/公开摘要/你的笔记** = 合理范围。
- 全文落地必须有授权依据（手动导入自用、已购授权、作者/平台明示允许、CC 协议）。
- 知乎、公众号取同样保守姿态：默认元数据，全文需授权或手动导入自用。

> 争议点：个人学习用途的“私人复制/合理使用”边界，中日法律与平台条款不完全一致，且“个人自用”与“用于自媒体二次创作”是两条线——前者宽松，后者必须有授权。**系统设计上把这两条线用 `rights_status` + `licenses.scope` 强制分开。**

## 三、已购授权的处理（需求 5 版权部分）

你买了版权的内容，走专门通道：

```text
你购买授权（课程/专栏/付费文章）
  → 把发票/订单截图/授权邮件存到 evidence_path
  → 在 licenses 表登记：licensor / scope / purchased_at / expires_at
  → 文档 rights_status = license_purchased
  → 按 scope 决定下游权限：
       scope=个人学习      → 可全文入库、可本地问答，不可发布
       scope=可二次创作    → 可改写进自媒体（仍需标来源/不抄表达）
       scope=可商用        → 可商用，按授权范围
  → expires_at 到期前 Agent 提醒复核
```

**关键**：`scope` 决定一切下游用途。没登记 scope 的，一律按最严（仅个人学习）处理。

## 四、导入模式（含已购授权档）

| 模式 | 存什么 | 触发条件 |
|---|---|---|
| metadata_only | 标题/URL/作者/来源/时间/摘要/你的笔记 | 默认（发现阶段） |
| summary_only | 元数据 + AI 摘要 + 少量引用片段 + 链接 | 需进索引但未授权全文 |
| fulltext_user_imported | 全文（自用） | 你手动复制/上传 |
| **license_purchased** | 全文 + 授权凭证 | licenses 表有有效记录 |
| own_content | 全文 | 你的原创/项目笔记 |

## 五、CMS / Obsidian 每条笔记必须显示的版权头

每篇 SAPKB 笔记的 frontmatter 强制字段：

```yaml
---
source_platform: CSDN
author: 张三
source_url: https://blog.csdn.net/...
imported_at: 2026-06-10
import_mode: metadata_only
rights_status: metadata_only
confidence_tier: reference
license_scope: null            # 若已购，填 individual/derivative/commercial
can_republish: false           # 由 rights_status + scope 推导
---
```

## 六、AI 生成内容的发布规则（继承 v1，强化）

用 SAPKB 内容生成视频稿/公众号/课程时：
1. 不复制原文表达；用自己的结构和观点重写。
2. 不隐去来源；关键事实保留引用。
3. 技术配置必须有来源依据；社区经验与官方文档冲突处标“需验证”。
4. **未授权（metadata_only/summary_only）的内容只能作为“线索”启发选题，不能成段引用。**
5. 引用他人原文片段时遵守合理使用：短、必要、标注、不替代原文。

## 七、项目机密保护

导入 SAP 项目资料（客户配置、项目文档）：
- 默认 `confidential:true`，`confidence_tier` 不进采集库公开流。
- 不参与公开内容生成、不上云端模型、不用于训练。
- 问答涉及时提示“项目上下文限定”。

## 七b、下架（takedown）流程 — v3 新增

作者或平台要求删除已收录内容时（无论当初导入是否合规），48 小时内执行：
DB 标记 `rights_status=takedown` → FTS 行删除 → 向量库按 vector_id 删除 →
vault 文件移入 `_trash/`（保留审计期后清除）→ audit_logs 记全程。
该内容若已进入选题池/已发布内容的素材链，逐项排查并移除引用。

## 七c、个人信息提示（PIPL / APPI）— v3 新增

采集作者名、主页 URL 属于个人信息处理。一般主张：个人/家庭事务范围的处理可豁免；
但内容一旦进入自媒体生产链（对外发布），就不再是纯自用。争议点在"个人知识管理"与
"经营性使用"的边界——本系统的处理姿态：作者信息仅用于来源标注与归档，
不做画像、不导出、不公开作者聚合页；对外发布时只保留"署名+链接"这一版权法本来要求的最小集。
此处不构成法律结论，涉及商用化前与法务确认。

## 八、合规审核输出格式（Compliance Reviewer 每次产出）

```json
{
  "compliance_status": "pass | warning | block",
  "risk_level": "low | medium | high",
  "rights_status": "metadata_only | summary_only | license_purchased | fulltext_allowed | own_content | blocked",
  "license_evidence_ok": true,
  "issues": [],
  "required_actions": []
}
```

## 九、最终原则

这个系统的目标不是“搬运互联网”，而是把你**合法获得**（公开线索 / 自用 / 已购授权 / 自有）的 SAP 信息，
沉淀为可追溯、可审计、可复用的个人知识资产。**宁可少收，不踩线。**

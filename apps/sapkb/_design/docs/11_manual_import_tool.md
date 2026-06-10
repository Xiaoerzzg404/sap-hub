# 11｜人工导入工具（版权阻塞时的兜底，Human-in-the-loop）

> 决策（Ryan，2026-06-10）：当自动发现因版权/平台条款被卡住、流程无法推进时，
> 由 **Cowork（主）/ Codex（机械实现）** 做一个**你手动操作**的导入工具，让你把正在浏览、有权访问的内容
> 一条一条手动收进 SAPKB。本节定义这个工具的形态与红线。

## 一、定位：它是“剪藏器”，不是“爬虫”

这是 Obsidian Web Clipper / Pocket / Readwise 那一类**单条、手动、人在环路**的保存工具：
- **你**在自己的浏览器里、用**你自己**的登录态，打开一篇你有权查看的文章；
- **你**点一下按钮，工具把**当前这一页**保存进 SAPKB；
- 一次一条，每条都是你主动决定的动作。

它**不是**：自动批量抓取、后台爬虫、替你登录、替你翻墙绕墙。

## 二、红线（写死在工具代码与说明里，违反即不做）

- 不存储/不读取任何平台账号密码、不替你登录、不持有你的 Cookie/token。
- 不绕验证码、不破解付费墙、不模拟人类行为、不用代理池。
- 不后台自动批量抓取；**每次保存都由你手动触发，单条**。
- 工具捕获的只是“**你当前已经能看到的那一页**”——它不去获取你看不到的内容。
- 默认 `rights_status = user_imported`、`confidence_tier = reference`、`can_republish = false`。
- 是否可二次创作/转载，**仍走 docs/04 的版权与 license 判定**，剪藏动作本身不解锁转载权。

> 一句话边界：工具帮你**省去复制粘贴的体力**，不替你**获得你本来无权获得的内容**。

## 三、两种形态（按你习惯二选一或都做）

### 形态 1：浏览器书签脚本 / 轻量扩展（推荐，最顺手）
- 你在文章页点一下，工具抓取**当前页面可见的**标题、作者、URL、正文、发布时间。
- 弹一个小表单让你确认/补：模块标签、rights_status、是否已购授权（若是，填 license 信息）。
- 一键写入 SAPKB（落 SQLite + 写 SAP_EXTKB 的 00_inbox）。

### 形态 2：剪贴板导入 CLI（最简单，零扩展）
- 你手动复制正文 → 运行 `python cli.py clip`，从剪贴板读内容 + 提示你粘 URL/作者。
- 适合不想装扩展、或平台不便挂扩展的场景（如部分 App 内文章）。

## 四、保存流程（两种形态共用后端）

```text
你手动触发（点扩展 / 跑 clip）
  → 工具读“当前页可见内容” 或 剪贴板
  → 弹表单：标题/作者/URL（必填） + 模块标签 + rights_status + license?(可选)
  → 经 Compliance Gate（盖默认值、记 audit_log）
  → 复用 collect 去重（防你重复收同一篇）
  → 入 documents（content_status=fulltext_user_imported，因为是你手动确认的自用全文）
  → 写 SAP_EXTKB/00_inbox/，frontmatter 带齐版权头
  → 进后续 SAP 处理（实体识别/摘要/标签）
```

## 五、已购授权的快捷登记

剪藏表单里若你勾“已购授权”：
- 让你填 `licensor / scope / purchased_at / expires_at`，并选一张本地发票/截图作 `evidence_path`；
- 写 `licenses` 表，文档 `rights_status` 升级为 `license_purchased`，`can_republish` 按 scope 推导。
- 没填 scope 一律按最严（仅个人学习）。

## 六、交给谁做（对齐新分工，见 docs/12）

- **Cowork（主）**：设计表单交互、Compliance Gate 接线、与 SAPKB 后端/去重的整合（要点判断、需思考）。
- **Codex（GPT-5.3，机械）**：写书签脚本骨架、CLI 读剪贴板、frontmatter 模板渲染、写文件等低认知活。
- 产出经 Cowork 自审 + 最终审（见 docs/08 / docs/12）才合入。

## 七、验收

- 打开一篇你有权看的 CSDN/知乎文章 → 点剪藏 → 确认表单 → SAPKB 里出现该条，version 头齐全，rights 正确。
- 重复剪藏同一篇被去重。
- 勾“已购授权”后 licenses 有记录、evidence 文件存在校验通过。
- 代码 grep 不到 登录/cookie/验证码/批量 抓取相关实现。

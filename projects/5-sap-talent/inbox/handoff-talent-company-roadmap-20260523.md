# 5 号交接：SAP 人才信任网络路线

- updated_by: codex
- updated_at: 2026-05-23T23:46:43+09:00

## 本轮范围

根据用户要求，为“东京一人公司老板、SAP FICO 高级顾问、SAP 自媒体、SAP 项目日语培训讲师”设计获取人才、激励人才、连接企业资源并逐步发展为 SAP × AI 人才企业的路线。

## 写入文件

- `projects/5-sap-talent/knowledge/talent-trust-network-playbook.md`
- `projects/5-sap-talent/knowledge/cards/talent-business-cards.md`
- `projects/5-sap-talent/state/talent-network-roadmap.json`
- `projects/5-sap-talent/state/network_pipeline.json`
- `projects/5-sap-talent/state/_index.json`

## 关键结论

- 5 号不应从传统猎头或无牌照撮合开始，而应先做“训练、作品、脱敏画像、信任网络”。
- 第一批人力不要招全职，优先从学员中培养助教候选人，再找内容/运营兼职协作者。
- 真实个人信息、客户信息、薪酬、签证、履历原文不得写入 git。

## 需要用户拍板

- 是否接受“先训练和展示，暂不收费撮合”的阶段顺序。
- 是否从现有 SAP 日语学员中选 1 到 2 位助教候选人。
- 真实人才资料未来放在哪里，需要另行选择合规受控位置。

## 验证

- 已用 `python3 -m json.tool` 检查新增和修改的 JSON。
- 已检查本轮新增说明类 Markdown 主体为中文。

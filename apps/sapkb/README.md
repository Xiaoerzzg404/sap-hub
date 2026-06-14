# SAPKB - Run01 机械子任务产物（本地阶段）

## 是什么
SAPKB 是 SAP 外部知识采集与知识库沉淀的本地项目；本阶段只完成最小链路：
- 采集输入（metadata）
- 数据库存储 schema 落库
- 命令行触发桩位
- Obsidian frontmatter 模板骨架

本阶段不实现正文抓取、去重、合规判定、标签化、Obsidian 写入（留给 Cowork/Lead）。

## 目录结构
```text
apps/sapkb/
├── ingest/           # harvest 植入点（本轮提供 fixture_csdn 产线）
├── process/          # 预留给 Lead（去重/标注）
├── kb/               # 预留给 Lead（检索与 RAG）
├── agents/           # 预留给 Lead（编排与审阅）
├── obsidian_sync/    # frontmatter 模板与后续同步
├── tests/            # smoke 验证桩
├── data/             # 本地数据库文件目录
├── pipeline.py        # 运行桩，接口留给 Lead 实现
├── cli.py             # CLI 入口
└── README.md
```

## 如何跑

1) 建库与中文 MATCH 自检
- `sqlite3 ~/sap-hub/apps/sapkb/data/sapkb.db < ~/sap-hub/configs/sapkb/schema.sql`
- 详见 `SCHEMA_SELFCHECK.txt`

2) 测试 fixture 采集
- `python /Users/openclawxiaoer/sap-hub/apps/sapkb/ingest/harvest.py --source fixture_csdn`

3) CLI（Lead 接口桩位）
- `python3 /Users/openclawxiaoer/sap-hub/apps/sapkb/cli.py harvest --source fixture_csdn`
- `python3 /Users/openclawxiaoer/sap-hub/apps/sapkb/cli.py search "SAP F110"`
- 当前 `pipeline.py` 为桩位，运行以上命令会触发 `NotImplementedError`，由 Lead 完成实现后可直接连库验证。

## 红线
- 不允许登录/口令/验证码绕过/代理池相关逻辑。
- 不持久化 `body` 正文，入库仅保留元数据与摘要。
- 不实现去重，复用既有 news/collect 去重策略。
- 不触碰 `vaults/SAP_FUZHKB`。

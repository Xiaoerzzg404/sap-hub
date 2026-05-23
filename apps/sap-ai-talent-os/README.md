# SAP AI Talent OS

东京一人公司老板使用的本地经营后台，用来管理 SAP 顾问人才池、企业需求、顾问资源推荐、内容生产、产品资产、教练资源和每周经营复盘。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Vitest

## 本地启动

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

默认地址：

```bash
http://localhost:3000
```

## 数据库初始化

SQLite 数据库使用 `.env` 中的：

```bash
DATABASE_URL="file:./dev.db"
```

初始化或更新 schema：

```bash
npx prisma migrate dev
```

当前本地环境如果遇到空的 `Schema engine error`，可以使用已提交的 SQL migration 直接初始化 SQLite：

```bash
rm -f prisma/dev.db
sqlite3 prisma/dev.db < prisma/migrations/20260523160000_init/migration.sql
npx prisma generate
npm run seed
```

重置并重新灌入示例数据：

```bash
npx prisma migrate reset
npm run seed
```

## 测试

```bash
npm run test
```

测试覆盖：

- `calculateConsultantScore`
- `matchConsultantsToDemand`
- `weeklyReviewMetrics`

## 主要页面

- `/dashboard`：经营指标、待办、最近顾问、最近需求、内容选题、人才池分布。
- `/consultants`：顾问列表、搜索、筛选、排序、新增、编辑、删除。
- `/consultants/[id]`：顾问详情、评分卡片、风险提示、评估记录、沟通记录。
- `/client-demands`：客户需求列表、搜索、筛选、新增、编辑、删除。
- `/client-demands/[id]`：需求详情、风险提示、顾问资源推荐入口。
- `/matching`：项目协作匹配，保存每次推荐记录。
- `/content`：内容选题、发布计划、每周 7 条内容占位。
- `/products`：课程、模板、Demo、内训、诊断咨询、PoC、长期顾问服务。
- `/coaches`：教练、导师、专家资源与沟通记录。
- `/weekly-reviews`：每周经营复盘和趋势展示。
- `/settings`：字典常量展示。

## 业务模块说明

系统定位是“SAP × AI 人才培养、能力评估、企业内训、项目交付支援和顾问资源池管理”。MVP 阶段不做复杂登录，不接入外部 AI API，不接入真实外部服务。

顾问总分由 6 个维度自动计算：

- SAP 模块能力 30%
- 项目经验真实性 20%
- 日语 / 英语沟通 20%
- 文档与交付习惯 10%
- AI 应用能力 10%
- 责任感与稳定性 10%

匹配推荐会先排除不可推荐顾问、状态不合格顾问和可用时间明显不合适的顾问，再按能力总分、模块、语言、可用时间和行业经验计算匹配分。

客户需求页面保留合规提醒：涉及职业介绍、派遣、收费转介等动作时，需要先做日本合规确认。系统不会承诺项目结果。

## 后续 Roadmap

- 增加真实业务数据的本地加密或私有存储策略。
- 增加脱敏画像导出和客户访谈纪要模板。
- 增加更完整的产品漏斗、收入和线索转化统计。
- 增加顾问作品集、训练营作业和能力证据库。
- 增加多用户权限、审计日志和 SaaS 部署配置。
- 在合规确认后，再扩展企业协作流程和合同节点管理。

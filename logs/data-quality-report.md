# 数据检查报告

- 共识别课程：24
- 共生成术语：528
- 共生成句型：480
- 共生成 Shadowing 项：480
- 共生成录音任务：120
- 共生成 Role Play：0
- 共生成待复核术语：127
- 共生成 LessonAsset：240（平均每课 10.0 份）

## 内容不足课程

- lesson_01 SAP概览与顾问身份建立: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_02 SAP GUI登录、基础导航与T-code说明: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_03 会议复习、画面共享与项目经验提问: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_04 实施方法论、Blueprint与配置需求: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_05 业务需求、MM模块与P2P入口: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_06 三点照合、统制科目与会计联动: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_07 接口、税务系统与SAP回传字段: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_08 关键用户、数据交换与接口需求确认: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_09 SD订单处理、报价到开票与流程说明: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_10 销售订单、客户需求与定制化报表: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_11 跨公司调拨、STO与供应链需求: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_12 S/4HANA成本要素、Scope与客户需求管理: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_13 生产流程、模块边界与客户付款: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_14 测试场景、SAP GUI安装与标准包: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_15 Fit-Gap、BTP/Fiori需求与方案选择: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_16 Configuration说明、业务需求与测试步骤准备: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_17 Enhancement、Customer Table与开发需求确认: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_18 SAP Activate、Best Practice与标准流程角色: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_19 Implementation Lifecycle、Discover/Prepare与Best Practice查找: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_20 SAP Activate vs ASAP、ECC到S/4HANA差异: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_21 ECC与S/4HANA架构、Fiori与CVI: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_22 第三方接口、大量数据处理与Reprocess: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_23 SAP版本确认、前台操作与Fiori经验说明: terms=22, phrases=20, shadowing=20, roleplays=0
- lesson_24 项目经验、报表需求与综合面试输出: terms=22, phrases=20, shadowing=20, roleplays=0

## 说明

- 可播放训练句的 audioSrc 已指向最终目标 `/audio/phrase/*.mp3` 与 `/audio/shadowing/*.mp3`；Phase 3 选 C，mp3 由 Ryan 后续手动 TTS 生成。
- 句型、Shadowing、Role Play 只从真实课程 Markdown 抽取；中文翻译字段留空，不编造。
- Substitution drill 暂返回空数组，等待后续 Phase 做真句替换识别。
- 录音作业 MVP 使用浏览器 IndexedDB 保存，不上传服务器。
- 待复核术语来自课程输出目录的待复核总表，状态统一初始化为 pending。

"""Generate the Life Coach integration layer.

The source material lives under knowledge/imported/life-os/人生教练.
This script creates enhanced coach plans and action cards, then links the
existing agent prompt files to those generated assets.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "knowledge" / "imported" / "life-os" / "人生教练"
OUTPUT_DIR = ROOT / "knowledge" / "life_coach"
ENHANCED_DIR = OUTPUT_DIR / "enhanced"
CARDS_DIR = OUTPUT_DIR / "cards"
AGENTS_DIR = ROOT / "agents"


@dataclass(frozen=True)
class Action:
    title: str
    card_type: str
    goal: str
    steps: tuple[str, ...]
    output: str
    training: str
    acceptance: str


@dataclass(frozen=True)
class Coach:
    agent_id: str
    agent_file: str
    source_file: str
    enhanced_file: str
    name: str
    identity: str
    understanding: str
    improvement: str
    actions: tuple[Action, ...]


def action(
    title: str,
    card_type: str,
    goal: str,
    steps: list[str],
    output: str,
    training: str,
    acceptance: str,
) -> Action:
    return Action(title, card_type, goal, tuple(steps), output, training, acceptance)


COACHES: tuple[Coach, ...] = (
    Coach(
        "00_orchestrator",
        "00_orchestrator.md",
        "SAP_FICO_Business_AI_职业升级与Agent系统行动手册.md",
        "00_orchestrator_life_coach.md",
        "总控战略与 Agent 系统行动教练",
        "我作为总控战略导师，负责把 3-5 年定位、90 天行动、每周 3 个目标和 Agent 调用压缩成一个可执行闭环。",
        "源文件的核心不是信息收集，而是要求用户停止同时问 13 个 Agent，通过总控入口把 SAP Finance 主业、Business AI 差异化、Demo、课程和商业化合并成一条产出线。",
        "增强重点：把行动手册中的每个路线、模板和交付物拆成可执行卡片，并让它成为所有 Agent 的上层路由规则。",
        (
            action("统一长期定位", "定位卡", "把所有学习和项目行动归入 SAP FICO × Business AI × 日本项目实战训练导师。", ["写出中文、日文、英文一句话定位", "检查当前项目、内容、课程是否能支撑定位", "把不支撑定位的学习暂缓"], "一页定位说明", "用 30 秒、60 秒、3 分钟分别讲述定位。", "能说清帮谁、解决什么问题、凭什么可信。"),
            action("拆解 6 个核心改进问题", "诊断卡", "识别职业标签、S/4 系统化、AI 场景、BTP 治理、产品化、职业杠杆六类缺口。", ["逐项写当前状态", "写改进目标", "为每项指定一个最小行动"], "六问题诊断表", "每周只选择 1-2 个缺口推进。", "每个缺口都对应一个产出物，而不是一句愿望。"),
            action("执行 90 天路线", "行动卡", "用 13 周完成定位、关键技术、Demo、个人品牌输出。", ["第 1-2 周重构定位", "第 3-6 周补 Business AI / BTP / Clean Core", "第 7-10 周做 Demo", "第 11-13 周发布文章、PPT、诊断清单"], "90 天路线看板", "每周用周复盘 Agent 检查进度。", "90 天结束至少有 2 个 Demo、4 篇文章、1 套 Workshop PPT。"),
            action("执行 12 个月升级路线", "路线卡", "从定位样品进入真实试点，再升级为方案负责人。", ["0-3 个月完成定位和样品", "3-6 个月争取项目内试点", "6-12 个月形成可重复咨询包"], "12 个月路线图", "每月写一次路线偏差复盘。", "每个季度都有可展示作品和商业化材料。"),
            action("建立首批 Finance AI 用例池", "知识卡", "优先沉淀月结、成本、AP、AR、AA、主数据、内控、CFO 报告场景。", ["每个场景写客户价值", "写输入/处理/输出", "写风险控制", "标记 Demo 优先级"], "Finance AI 用例清单", "每周新增 3-5 个用例卡。", "至少 30 个用例中选出 3 个 Demo 候选。"),
            action("限制每次 Agent 调用", "流程卡", "保持一个入口、最多 3 个专业 Agent，防止信息过载。", ["先由总控判断任务类型", "选择 2-3 个专业 Agent", "统一形成行动计划", "周日复盘"], "Agent 调用记录", "把日常问题都转成 daily / weekly / topic / review 四类输入。", "不会再为同一问题开启十几个独立对话。"),
            action("使用每日 5 分钟模板", "训练卡", "每天快速判断今日最小产出与调用 Agent。", ["填写日期、时间、工作状态", "写今天最想推进的事情", "写卡住的问题", "写昨天产出"], "每日计划日志", "每天只保留 1 个最小胜利。", "当天结束时能看到一个实际产出。"),
            action("使用每周计划模板", "训练卡", "每周只保留 3 个最重要目标。", ["输入可用时间和工作压力", "列上周产出和未完成", "删除不重要任务", "定义每个目标的最小完成标准"], "每周计划", "周一用总控 Agent 做任务砍削。", "本周任务不超过 3 个核心目标。"),
            action("使用专题深挖模板", "训练卡", "把一个主题转成专业 Agent 协作任务。", ["写主题和目标", "总控选择 Agent", "明确每个 Agent 回答的问题", "定义本周最小版本"], "专题深挖 Prompt", "用月结关账 AI 助手做一次完整演练。", "专题输出包含业务、AI、Demo、治理、产品化至少 3 个维度。"),
            action("使用周复盘模板", "训练卡", "每周检查真实产出，删除伪忙碌。", ["列完成产出", "列没完成原因", "找最大浪费", "删除下周不该做的任务", "生成下周 3 目标"], "周复盘日志", "周日固定运行 review。", "复盘结论能直接变成下周计划。"),
            action("设计第一个推荐 Demo", "Demo 卡", "以月结关账 AI 助手展示 FICO、AI、日语说明能力。", ["准备 20 行模拟数据", "写 AI 提示词", "生成异常分析", "做一页 PPT", "写日文客户说明"], "月结关账 AI 助手最小 Demo", "用 Demo / PoC Agent 拆分截图和文件。", "不接真实系统也能展示业务逻辑。"),
            action("设计第一个咨询包", "商业卡", "把 Readiness Assessment 作为从内容到咨询的桥。", ["列流程诊断范围", "列用例优先级矩阵", "列数据质量和权限检查", "列 90 天 PoC 路线", "列 ROI 初估"], "SAP Finance AI Readiness Assessment", "用商业化 Agent 写一页销售说明。", "客户能理解买到的是诊断、路线和风险控制，不是泛 AI 聊天。"),
        ),
    ),
    Coach(
        "01_positioning",
        "01_positioning.md",
        "SAP_FICO_Business_AI_职业定位导师.md",
        "01_positioning_life_coach.md",
        "职业定位与市场战略人生教练",
        "我作为职业定位导师，负责把用户从传统 FICO 执行顾问升级成日本市场可识别的 Finance Transformation × Business AI 实战训练专家。",
        "源文件已经给出中文、日文、英文定位、LinkedIn 文案、案例模板、客户画像和 12 个月标签规划。",
        "增强重点：把定位素材变成可复用资产库，并要求每个表达都必须有案例证据支撑。",
        (
            action("重写一句话定位", "定位卡", "形成中日英三版统一定位。", ["中文强调帮谁和能力跃迁", "日文强调日本市场和人材育成", "英文强调 Finance Transformation 与 real project delivery"], "三语一句话定位", "每天朗读一次，直到自然表达。", "三版表达语义一致，且不过度夸大。"),
            action("设计职业标签组", "信息卡", "建立可放入简介、简历、文章署名的专家标签。", ["保留 SAP FICO 主线", "加入 S/4HANA Finance", "加入 Business AI / BTP", "加入日本项目实战"], "职业标签清单", "用不同受众测试标签理解度。", "客户、学员、招聘方都能看懂。"),
            action("打磨 30 秒自我介绍", "训练卡", "用于初次见面和线上简介。", ["一句身份", "一句服务对象", "一句差异化", "一句目标"], "30 秒中文自我介绍", "录音 3 次，删除空话。", "30 秒内讲清楚，不出现泛 AI 口号。"),
            action("打磨 60 秒自我介绍", "训练卡", "用于面试、客户会前开场和社群介绍。", ["说明当前经验", "说明升级方向", "列 3 个核心能力", "列服务对象"], "60 秒自我介绍", "翻译成自然日语版本。", "听众能复述你的三类能力。"),
            action("打磨 3 分钟自我介绍", "训练卡", "用于讲座开场、面试深答和合作介绍。", ["先讲市场变化", "再讲你的三类优势", "再讲服务对象", "最后讲可交付成果"], "3 分钟自我介绍", "用日语售前 Agent 做商务日语化。", "不是履历流水账，而是价值叙事。"),
            action("更新 LinkedIn 中文简介", "行动卡", "把中文简介从经历描述改成价值主张。", ["写 Headline", "写 About", "列关注领域", "加入作品或案例链接占位"], "LinkedIn 中文简介", "对照定位检查关键词密度。", "Headline 能一眼说明 SAP FICO / Business AI / Japan。"),
            action("更新 LinkedIn 日文简介", "行动卡", "适配日本市场客户和招聘方。", ["保留 SAP FICO / S/4HANA Finance", "使用自然商务日语", "强调日中双语和実践支援"], "LinkedIn 日文简介", "请日语 Agent 优化敬语和语气。", "不直译中文，日语读起来像日本商务资料。"),
            action("更新 LinkedIn 英文简介", "行动卡", "用于国际化职业背书。", ["突出 Japan market", "突出 finance transformation", "突出 practical capabilities"], "LinkedIn 英文简介", "保持短而可信。", "不堆砌 buzzword。"),
            action("建立问题-行动-成果案例库", "知识卡", "把项目经验转成可展示证据。", ["选择 S/4 转型、日中桥梁、Business AI 场景三类案例", "每个案例只写脱敏问题", "写你的行动", "写可验证成果"], "项目案例库", "每周补 1 个案例。", "不出现客户名和敏感数据。"),
            action("建立目标客户画像", "商业卡", "区分顾问、企业、SIer、财务 DX 客户。", ["列每类客户痛点", "写你提供的价值", "标记可销售产品"], "客户画像表", "用商业化 Agent 转成服务菜单。", "每类客户对应一个明确服务入口。"),
            action("规划 12 个月专家标签", "路线卡", "让品牌标签随作品逐步升级。", ["1-3 个月聚焦日本 SAP FICO 项目实战", "4-6 个月升级 S/4HANA Finance", "7-9 个月加入 Business AI", "10-12 个月形成 Finance DX 训练导师"], "12 个月标签路线", "每季度检查作品是否支撑标签。", "标签升级不是改名，而是有新作品证据。"),
        ),
    ),
    Coach(
        "02_s4hana_finance",
        "02_s4hana_finance.md",
        "S4HANA_Finance_深化路线_Week0.md",
        "02_s4hana_finance_life_coach.md",
        "S/4HANA Finance 深化人生教练",
        "我作为 S/4HANA Finance 深化导师，负责把 FICO 项目经验系统化、教学化、AI 场景化。",
        "源文件覆盖 S/4HANA Finance 定位、知识地图、ECC 差异、模块路线、日本本地化、认证、项目问题、AI 场景和 12 周路线。",
        "增强重点：把每个模块学习要求转成输出作业和知识卡，使 Finance 主业成为 AI 差异化的底座。",
        (
            action("建立 S/4HANA Finance 核心定位", "知识卡", "理解 S/4HANA Finance 不是 ECC 升级，而是实时、统一、AI-ready 财务数据模型。", ["解释 Universal Journal", "解释 ACDOCA", "连接 FI/CO/AA/Margin Analysis", "说明实时分析和 Closing 自动化"], "S/4HANA Finance 核心说明卡", "用 5 分钟讲给非 SAP 财务人员。", "能讲清数据统一带来的项目价值。"),
            action("绘制 S/4HANA Finance 知识地图", "训练卡", "覆盖业务流程、数据模型、FI、CO、AA、Closing、集团、AI 层。", ["按层级列知识点", "每层写能力目标", "每层写一个 AI 场景"], "知识地图图稿", "每周更新一层。", "图中至少包含流程、数据、模块、AI 四条线。"),
            action("制作 ECC vs S/4 差异矩阵", "知识卡", "把传统经验升级为 S/4 转型说明能力。", ["对比数据模型", "对比 FI/CO 统一", "对比 CO-PA 与 Margin Analysis", "对比 Business Partner 和 Fiori/CDS"], "ECC vs S/4 差异表", "用客户升级场景做问答练习。", "能说明为什么升级后不能只搬配置。"),
            action("深化 FI 路线", "训练卡", "掌握 Ledger、Accounting Principle、Tax、Open Item、Clearing、FSV。", ["每个主题写业务含义", "写关键配置或对象", "写项目问题", "写 AI 应用机会"], "FI 深化笔记", "做 GL/AP/AR 月结小题。", "能从 FI 主题导出报表、清账、异常分析用例。"),
            action("深化 CO 路线", "训练卡", "掌握 Cost Center、Internal Order、Allocation、Settlement、Product Costing。", ["画成本流", "列常见差异", "写成本异常 AI 解释场景"], "CO 场景卡", "以成本中心差异做案例演练。", "能解释成本差异的业务原因和数据对象。"),
            action("深化 AA 路线", "训练卡", "理解 New Asset Accounting、Depreciation Area、Parallel Accounting。", ["列资产主数据", "列折旧范围", "列并行会计影响", "列资产 AI 场景"], "AA 深化卡", "做折旧异常排查练习。", "能说明 New AA 对月结和报表的影响。"),
            action("深化 AP 路线", "训练卡", "掌握 APP、Invoice Verification、Withholding Tax。", ["写 AP 流程", "写付款条件和付款媒介", "写重复付款风险", "写 AI 检查点"], "AP 场景卡", "做 AP 自动付款测试场景。", "能设计 AP 异常检查用例。"),
            action("深化 AR 路线", "训练卡", "掌握 Incoming Payment、Dunning、Credit Management。", ["写收款与清账流程", "写催收与信用风险", "写自动匹配 AI 场景"], "AR 场景卡", "复用 AR Demo 的字段设计。", "能解释一笔付款如何匹配发票。"),
            action("深化 Closing 路线", "训练卡", "掌握外币评估、应计、重分类、财务报表。", ["列 Closing 任务", "列依赖与风险", "写月结 Copilot 场景"], "Closing 路线卡", "做月结关账 AI 助手专题。", "能把月结流程转成风险雷达和管理评论。"),
            action("深化 Margin Analysis 路线", "训练卡", "从 ECC CO-PA 思维转向 Account-based Margin Analysis。", ["列 characteristic", "列 profitability segment", "设计毛利桥分析"], "Margin Analysis 卡", "做低毛利预警练习。", "能解释报表维度为何要前置设计。"),
            action("了解 Group Reporting", "信息卡", "掌握 consolidation unit、elimination、currency translation、group financial statement。", ["列集团合并对象", "写与 FI/CO 的连接", "标记未来深入点"], "Group Reporting 入门卡", "用集团客户场景练习。", "能判断是否需要进入集团方案层。"),
            action("了解 Central Finance", "信息卡", "掌握 mapping、replication、AIF error handling、central reporting。", ["画源系统到 Central Finance 数据流", "列映射风险", "列报表价值"], "Central Finance 入门卡", "做一张 Central Reporting 价值说明。", "能说明 CFIN 不只是接口复制。"),
            action("整理日本本地化重点", "知识卡", "覆盖消费税、qualified invoice、固定资产税务、法定报表。", ["列主题", "写项目影响", "写日语关键词"], "日本本地化卡", "用日语售前 Agent 生成表达。", "能在日本项目中提出本地化注意事项。"),
            action("执行 12 周学习路线", "路线卡", "按 Week1-12 依次学习 Universal Journal 到认证与教学设计。", ["每周一个主题", "每周一个输出", "每周一个 AI 场景"], "12 周学习计划", "周复盘检查每周输出。", "12 周后形成一套可教学材料。"),
            action("完成 Week0 作业", "行动卡", "用 3 个作业启动 S/4 深化。", ["绘制 Universal Journal 知识图", "输出 ECC vs S/4 差异矩阵", "设计 ACDOCA 月结 AI 助手"], "Week0 作业包", "用 topic 命令生成月结助手 Prompt。", "三个作业都有文件或图稿。"),
        ),
    ),
    Coach(
        "03_sap_business_ai",
        "03_sap_business_ai.md",
        "SAP_Business_AI_Joule_Finance_Guide.md",
        "03_sap_business_ai_life_coach.md",
        "SAP Business AI / Joule 人生教练",
        "我作为 Business AI 导师，负责把 SAP AI 概念翻译成 Finance 场景、客户价值和治理边界。",
        "源文件明确区分普通 ChatGPT 与企业级 SAP AI，并给出 Finance 模块映射、日本企业关注点、风险矩阵和内容标题。",
        "增强重点：把 Business AI 从概念学习变成客户可听懂的价值说明和可落地用例库。",
        (
            action("解释 SAP Business AI 一句话", "信息卡", "把 AI 定义为嵌入 SAP 流程的企业级 AI。", ["说明不是聊天机器人", "说明理解业务对象、权限、流程", "说明 Relevant / Reliable / Responsible"], "Business AI 概念说明", "用 CFO、财务经理、IT 三种语言各讲一遍。", "听众不会误解为普通 ChatGPT。"),
            action("掌握 Business AI 核心组件", "知识卡", "理解 Joule、Joule Agents、GenAI Hub、AI Core、Prompt Registry、Grounding、Responsible AI。", ["列组件", "写简单解释", "写客户说明话术"], "组件速查卡", "每个组件用一个 Finance 场景解释。", "能说明组件在企业 AI 架构中的位置。"),
            action("比较 ChatGPT 与 SAP 企业 AI", "知识卡", "建立企业级 AI 价值边界。", ["比较数据", "比较流程嵌入", "比较权限", "比较审计", "比较顾问价值"], "AI 差异矩阵", "用日本客户疑问做问答训练。", "能解释为什么企业不能只用通用聊天。"),
            action("映射 Finance 模块与 AI 场景", "用例卡", "把 GL、AP、AR、AA、CO、Treasury、GRC、Tax 转成 AI 场景。", ["每个模块列 1-2 个场景", "写输入数据", "写 AI 输出", "写价值"], "Finance AI 关系图", "每周选一个模块扩展成用例卡。", "至少形成 10 个可落地用例。"),
            action("整理日本企业关注点", "售前卡", "把内控、审计、J-SOX、审批、权限、解释性作为日本落地重点。", ["列关注点", "写风险", "写保守表达"], "日本企业 AI 关注点卡", "用日语 Agent 生成会议表达。", "表达重点是可治理辅助，不是自动替代。"),
            action("建立客户价值矩阵", "商业卡", "针对 CFO、财务经理、IT/内控分别讲价值。", ["列角色", "列关心 KPI", "列 AI 价值", "列风险控制"], "客户价值矩阵", "用于售前 PPT 第一版。", "每个价值都有 KPI 或业务结果。"),
            action("建立风险与治理矩阵", "治理卡", "覆盖幻觉、权限泄漏、审计缺失、Prompt 混乱、数据泄漏、责任不清。", ["列风险", "列问题", "列治理方式"], "Business AI 风险矩阵", "和治理 Agent 联合复核。", "每个用例都能引用对应控制措施。"),
            action("评估 Finance AI 风险等级", "治理卡", "区分低、中、高、极高风险场景。", ["报告摘要可自动化", "差异分析需人确认", "会计分录必须审批", "财务披露只能辅助"], "风险等级卡", "给每个 Demo 标注等级。", "不会把高风险动作包装成自动执行。"),
            action("生成内容资产标题", "产品化卡", "把学习内容转成文章、PPT、Workshop 和课程章节。", ["列文章标题", "列 PPT 标题", "列 Workshop 标题", "列课程章节"], "Business AI 内容标题库", "每周选择一个标题输出。", "标题能服务定位和潜在产品。"),
        ),
    ),
    Coach(
        "04_btp_clean_core",
        "04_btp_clean_core.md",
        "SAP_BTP_Clean_Core_Architecture_Mentor_Notes.md",
        "04_btp_clean_core_life_coach.md",
        "BTP / Clean Core 架构人生教练",
        "我作为架构导师，负责让 FICO 顾问具备 Clean Core、BTP、API、集成、Build 和 AI 架构判断力。",
        "源文件强调 BTP 是 ERP 外围创新平台，Clean Core 判断顺序必须从标准功能开始，AI 不应直接自动过账。",
        "增强重点：把架构知识变成客户可解释的判断树、数据流和治理说明。",
        (
            action("用 FICO 视角解释 BTP", "知识卡", "把 BTP 理解为 ERP 外围创新平台，而不是替代 S/4。", ["列集成、AI、自动化、Workflow、API、扩展、分析", "映射到 FICO 需求"], "BTP 业务解释卡", "向 CFO 和 CIO 分别解释一次。", "能避免把 BTP 讲成纯开发平台。"),
            action("掌握 Clean Core 判断顺序", "决策卡", "永远按标准功能、Key User Extensibility、ABAP Cloud、BTP Side-by-side 判断。", ["先问标准能不能做", "再问是否简单字段/逻辑", "再问 Released API/BAdI", "最后考虑 BTP"], "Clean Core 判断树", "每个需求都写判断理由。", "不会一上来建议开发。"),
            action("使用 Clean Core 判断清单", "行动卡", "把需求快速归类到标准、扩展、集成、自动化或 BTP。", ["逐项回答清单问题", "记录推荐方式", "记录风险"], "Clean Core 判断表", "用 3 个 Finance AI 场景演练。", "推荐方式有清晰依据。"),
            action("判断哪些需求放 BTP", "知识卡", "识别 AI、外部系统、独立 UI、跨系统流程四类 BTP 场景。", ["列场景类型", "列理由", "列不适合放核心的原因"], "BTP 适用场景卡", "为月结助手设计 side-by-side 边界。", "能说明 BTP 与 S/4 的职责边界。"),
            action("解释 API / OData / Event / iFlow", "知识卡", "用业务语言解释接口概念。", ["API 是服务窗口", "OData 是 SAP 常用接口格式", "Event 是业务动作通知", "iFlow 是接口流程图"], "接口概念卡", "用银行入账或 AP 发票场景解释。", "非技术客户也能理解。"),
            action("设计 AR 逾期 AI 分析架构", "架构卡", "练习 Finance AI 推荐架构。", ["用户入口 SAP Build App", "流程 Build Process Automation", "集成 Integration Suite", "读取 S/4 AR Open Item", "AI 生成原因与建议", "人工确认后回写"], "AR 逾期 AI 架构图", "画成文字版和一页图。", "包含数据流、权限、回写边界。"),
            action("识别 SAP Build Apps 场景", "知识卡", "用于财务 Portal、移动审批、Dashboard、AI UI。", ["列业务 UI", "列用户", "列数据来源"], "SAP Build Apps 场景卡", "设计一个 CFO Dashboard 入口。", "知道低代码适用边界。"),
            action("识别 Build Process Automation 场景", "知识卡", "用于 AP 审批、付款审批、月结任务、RPA、人工确认。", ["列流程触发点", "列审批人", "列 AI 建议与人工确认"], "Build Process Automation 卡", "给付款风险评分设计人工确认流。", "流程不绕过 SAP Workflow 和审批。"),
            action("掌握 Integration Suite 核心作用", "知识卡", "理解企业级集成平台在 Finance AI 中的位置。", ["列连接系统", "列转换和监控", "列错误处理"], "Integration Suite 卡", "用银行/OCR/税务系统做例子。", "能说明为什么不用临时脚本硬连生产。"),
            action("理解 ABAP Cloud 与 Released API", "知识卡", "知道官方允许 API 是 Clean Core 的关键。", ["解释 Released API", "说明升级稳定性", "说明官方支持"], "ABAP Cloud 入门卡", "和技术顾问沟通时使用。", "能提出正确问题而不是乱改核心。"),
            action("设计 Finance AI 治理架构", "治理卡", "AI 生成建议、人工确认、标准接口回写。", ["AI 只建议", "人工确认", "标准接口回写", "记录日志"], "Finance AI 治理架构卡", "和治理 Agent 联合复核。", "没有自动过账、自动付款等越界动作。"),
            action("准备 CFO 解释模板", "售前卡", "用客户能懂的话解释 Clean Core 价值。", ["强调核心标准化", "把 AI/审批/移动化放 BTP", "说明降低升级和维护成本"], "Clean Core CFO 话术", "转成日语会议版。", "不技术化，但保留架构边界。"),
        ),
    ),
    Coach(
        "05_finance_ai_usecases",
        "05_finance_ai_usecases.md",
        "SAP_Finance_AI_Use_Cases_Period_End_Closing.md",
        "05_finance_ai_usecases_life_coach.md",
        "Finance AI 用例设计人生教练",
        "我作为用例设计导师，负责把 Finance 流程痛点转成输入、处理、输出、价值、治理和 Demo。",
        "源文件以月结关账为第一篇，说明 Closing 是最适合切入的 AI 场景，并给出 Closing Risk Radar 和 Assessment 模板。",
        "增强重点：把一个月结用例拆成可复用用例卡模板，后续 AP/AR/CO 等场景都按同样结构复制。",
        (
            action("判断为什么从 Closing 开始", "判断卡", "确认月结横跨 FI/CO/AA/AP/AR，管理层关注且适合 Demo。", ["列流程范围", "列人工协调点", "列风险控制要求", "列管理层价值"], "Closing 切入理由卡", "向总控说明为什么先做月结。", "理由包含业务价值、可展示性和可产品化。"),
            action("绘制 Closing 用例地图", "用例卡", "把任务管理、分录准备、异常清理、集团协同、调节、管理汇报映射成 AI 用例。", ["每个环节写一个 AI 用例", "标注输入和输出", "标注 Demo 难度"], "Closing 用例地图", "每周扩展一个用例。", "用例不低于 6 个且互不重复。"),
            action("定义 AI 月结任务风险雷达", "用例卡", "设计 Closing Risk Radar 用例名称和定位。", ["写中英文名", "写目标用户", "写核心价值"], "Risk Radar 用例卡", "用一句话讲给 CFO。", "能明确不是替代关账，而是提前识别风险。"),
            action("拆解业务痛点", "诊断卡", "说明月结任务多、依赖复杂、延期风险不可见。", ["列痛点", "标注发生环节", "标注影响角色"], "Closing 痛点卡", "把痛点转成访谈问题。", "痛点具体到任务、依赖或异常。"),
            action("定义目标用户", "画像卡", "覆盖 Closing Manager、Controller、SSC Lead、CFO Office。", ["写用户职责", "写关心指标", "写 AI 输出偏好"], "Closing 用户画像卡", "给每个角色写一句价值话术。", "每个角色都有不同的关注点。"),
            action("设计输入数据", "数据卡", "明确 task list、owner、due date、completion、job/interface status、open items、历史数据。", ["列字段", "写来源", "写敏感等级"], "Closing 输入数据卡", "用脱敏模拟数据演练。", "字段足够支持风险评分和原因解释。"),
            action("设计 AI 处理逻辑", "知识卡", "预测延期、分析依赖、识别关键路径、检索 SOP、解释风险原因。", ["列处理步骤", "列规则和 AI 边界", "列人工确认点"], "Closing AI 逻辑卡", "用 3 个异常任务测试。", "逻辑可解释，不只给黑盒分数。"),
            action("设计输出结果", "输出卡", "生成风险评分、延期预测、根因分析、建议动作、Closing Health Dashboard。", ["列输出字段", "写展示形式", "写管理层摘要"], "Closing 输出卡", "做一张 Dashboard 草图。", "输出能支持下一步行动。"),
            action("定义 SAP 集成点", "架构卡", "连接 Advanced Financial Closing、S/4HANA、Workflow、Fiori、Universal Journal、BTP AI。", ["列系统对象", "写只读/写回边界", "写 Clean Core 方式"], "Closing 集成点卡", "和 BTP Agent 联合检查。", "不会把 Demo 误说成生产架构。"),
            action("设计风险控制", "治理卡", "加入 role-based authorization、人工审批、审计日志、Prompt Logging、脱敏。", ["列控制点", "标注高风险动作", "写审计字段"], "Closing 风险控制卡", "用治理 Agent 复核。", "每个 AI 输出都有责任边界。"),
            action("设计推荐 Demo Cockpit", "Demo 卡", "把 Risk Radar、Exception Explainer、Variance Narrative、Governance 做成 cockpit。", ["画页面结构", "列 4 个组件", "写演示顺序"], "Financial Closing Cockpit Demo 卡", "用 Demo Agent 生成截图清单。", "能在 5 分钟内讲清价值。"),
            action("使用 Finance AI Assessment 模板", "评估卡", "从流程痛点、数据可得性、AI 适配度、可视化、PoC 验证、治理评估用例。", ["逐项打分", "排序用例", "选择 Demo 候选"], "Assessment 模板卡", "用于所有后续用例。", "每个用例都有做/不做理由。"),
        ),
    ),
    Coach(
        "06_demo_poc",
        "06_demo_poc.md",
        "SAP_Finance_AI_Demo_01.md",
        "06_demo_poc_life_coach.md",
        "Demo / PoC 制作人生教练",
        "我作为 Demo 教练，负责把 Finance AI 想法压成最小可展示作品，先用模拟数据证明业务逻辑。",
        "源文件给出应收来款智能匹配助手的目标观众、MVP、三张数据表、流程、Prompt、输出样例和最小交付物。",
        "增强重点：把 Demo 制作拆成可完成的文件、截图、话术和验收标准，避免做成大系统。",
        (
            action("确定 Demo 名称与定位", "Demo 卡", "用 AI-Powered Cash Application Assistant 展示 FI-AR 来款匹配能力。", ["写中文名", "写英文名", "写一句目标"], "Demo 命名卡", "用日语写一版会议标题。", "标题能让 FICO 顾问和 CFO 都懂。"),
            action("区分目标观众", "画像卡", "针对顾问、AR 主管、CFO、学员分别设计打动点。", ["列观众", "列他们关心什么", "列 Demo 要证明什么"], "Demo 观众卡", "每类观众写 1 句开场。", "演示不会只对技术人员有效。"),
            action("锁定本周 MVP", "行动卡", "只做两张输入表、一张匹配结果表和管理层摘要。", ["准备 Open AR Invoices", "准备 Bank Statement Incoming Payments", "生成 Matching Result", "生成摘要"], "Demo MVP 范围卡", "拒绝本周加入系统集成。", "本周可交付 Excel 和截图。"),
            action("设计未清应收发票字段", "数据卡", "建立 Open AR Invoices 模拟表。", ["列 Company Code、Customer、Invoice、Due Date、Currency、Amount、Assignment、Text", "标注每字段用途"], "Open AR 字段卡", "造 10 行模拟数据。", "数据能覆盖完全匹配和多发票匹配。"),
            action("设计银行入账字段", "数据卡", "建立 Bank Statement Incoming Payments 模拟表。", ["列 statement id、payment date、payer、memo、amount、fee、house bank", "标注匹配线索"], "Bank Statement 字段卡", "造 5 行不同复杂度来款。", "数据能覆盖短付、手续费、备注不完整。"),
            action("设计 AI 匹配结果字段", "输出卡", "输出 Suggested Customer、Matched Invoice、Difference、Match Type、Confidence、Reason、Action。", ["列结果字段", "写业务含义", "写置信度解释"], "Matching Result 字段卡", "生成一张结果表截图。", "财务人员能据此人工确认。"),
            action("编排 5 步 Demo 流程", "流程卡", "从业务背景到管理层摘要形成故事线。", ["展示未清发票", "展示银行入账", "AI 分析", "输出建议表", "输出摘要"], "Demo 流程卡", "用 5 张幻灯片讲一遍。", "流程不超过 5 分钟。"),
            action("完善来款匹配 Prompt", "Prompt 卡", "让 AI 支持一对一、多对多、短付、手续费、备注不完整、客户名不一致。", ["写角色", "写输入表", "写任务", "写输出格式", "写限制条件"], "AR Matching Prompt 卡", "用 3 组数据测试输出稳定性。", "每条建议都有原因和置信度。"),
            action("准备输出样例", "样例卡", "提供至少一条一笔来款匹配多张发票的示范。", ["写 Payment ID", "写 Payer", "写 Matched Invoice", "写 Difference", "写 Proposed Action"], "输出样例卡", "加入一个异常样例。", "样例能解释 AI 判断依据。"),
            action("打磨演示话术", "售前卡", "强调 Demo 使用模拟数据、AI 是辅助判断。", ["开场说明场景", "说明不是替代 SAP", "说明人工确认", "说明管理价值"], "演示话术卡", "生成日语版。", "不会夸大为自动清账生产方案。"),
            action("完成本周最小交付", "行动卡", "交付 Excel 文件和一张 Matching Result 截图。", ["建三张表", "填模拟数据", "跑一次 Prompt", "截图结果", "写 README"], "AR Demo 最小交付包", "周复盘检查文件路径。", "文件和截图真实存在。"),
        ),
    ),
    Coach(
        "07_data_cfo_reporting",
        "07_data_cfo_reporting.md",
        "CFO_Monthly_Finance_Analysis_Playbook.md",
        "07_data_cfo_reporting_life_coach.md",
        "数据分析与 CFO 报表人生教练",
        "我作为 CFO 报表导师，负责把 SAP 数据从表字段升级成经营洞察、Dashboard 和管理层解读。",
        "源文件围绕收入、毛利、费用、经营利润差异分析，给出 ACDOCA/ACDOCP 字段、Variance Tree、SQL、Dashboard、Power BI、SAC、话术和 AI Prompt。",
        "增强重点：让用户从“知道数据在哪张表”升级为“知道 CFO 想看什么，并能解释利润偏离预算”。",
        (
            action("定义 CFO 月报主题", "分析卡", "聚焦收入、毛利、费用与经营利润差异。", ["写分析目标", "写核心问题", "写预算对比口径"], "CFO 月报主题卡", "用一个月度经营会议场景练习。", "能回答为什么利润偏离预算。"),
            action("整理 CFO 真正关心的问题", "知识卡", "覆盖 revenue、gross margin、cost、OPEX、profit center、trend。", ["列问题", "列分析方向", "列对应 KPI"], "CFO 问题清单", "每个问题写一条管理层解读。", "问题不是报表字段，而是经营判断。"),
            action("设计 Actual 数据字段", "数据卡", "从 ACDOCA 提取 company code、period、G/L、amount、profit/cost center、segment、material、customer。", ["列字段", "写含义", "写用途"], "ACDOCA 字段卡", "用脱敏样例建 Fact 表。", "字段能支持 P&L variance。"),
            action("设计 Budget 数据字段", "数据卡", "从 ACDOCP 提取预算金额和 category。", ["列字段", "写预算/forecast 口径", "写 join key"], "ACDOCP 字段卡", "做 Actual vs Budget join 练习。", "预算口径与实际口径一致。"),
            action("建立 P&L Variance Tree", "知识卡", "用 Revenue - COGS = Gross Profit，再到 Operating Profit。", ["画树", "写公式", "标注 variance"], "Variance Tree 卡", "用 3 个数字手算一遍。", "能解释毛利率下降如何影响经营利润。"),
            action("编写 SQL 示例", "训练卡", "用 report line、actual、budget、variance 生成差异表。", ["写 SELECT", "写 variance 计算", "加入 period 和 company 过滤"], "SQL 练习卡", "扩展为 variance percentage。", "SQL 能输出管理报表基础表。"),
            action("设计 CFO Overview Dashboard", "Dashboard 卡", "展示 Revenue、Gross Margin、OPEX、Operating Profit、Cash Balance。", ["定 KPI", "定页面布局", "定颜色规则"], "CFO Dashboard 卡", "做一页线框图。", "高层 30 秒能看到异常。"),
            action("设计 Power BI 星型模型", "数据建模卡", "用 Fact_PnL 与 Dim_GLAccount、ProfitCenter、CostCenter、Date。", ["列事实表", "列维表", "列关系"], "Power BI 模型卡", "用 CSV 模拟数据建模。", "模型支持按利润中心和期间分析。"),
            action("规划 SAC 学习方向", "路线卡", "先学 Story、KPI Card、Variance Analysis。", ["列第一阶段主题", "写练习任务", "连接 CFO 月报"], "SAC 学习卡", "每周做一个 Story 草图。", "学习服务 CFO 报告，而不是泛学工具。"),
            action("打磨管理层解读话术", "表达卡", "把数字变化转成业务语言。", ["先说结论", "再说主要原因", "再说需调查事项", "再说下一步"], "管理层话术卡", "用日语 Agent 做正式版。", "不只描述数字，而能解释原因。"),
            action("编写 AI 自动分析 Prompt", "Prompt 卡", "让 AI 基于 Actual vs Budget 数据生成月报摘要。", ["设定 CFO 报表分析师角色", "给数据字段", "要求结论、原因、风险、行动"], "CFO AI Prompt 卡", "用模拟数据测试。", "AI 输出适合管理层阅读且标注假设。"),
            action("制定 SQL / SAP 建模 / Power BI / SAC 学习路线", "路线卡", "把分析能力分四条训练。", ["SQL 学 GROUP BY / JOIN / WINDOW / CASE", "SAP 学 ACDOCA / ACDOCP / CDS", "Power BI 学 DAX / Star Schema / Waterfall", "SAC 学 Story / Planning / Predictive"], "CFO 分析学习路线", "每条路线产出一个练习文件。", "学习能转成 Dashboard 或分析文章。"),
        ),
    ),
    Coach(
        "08_ai_governance",
        "08_ai_governance.md",
        "SAP_Finance_AI_Governance_Framework.md",
        "08_ai_governance_life_coach.md",
        "AI 治理 / 安全 / 权限人生教练",
        "我作为治理导师，负责确保 Finance AI 不绕过财务控制、权限、审计和人工责任。",
        "源文件给出 AI 定位、企业控制原则、风险等级、敏感数据、权限矩阵、审计日志、Human-in-the-loop、禁止动作和客户说明话术。",
        "增强重点：把治理框架变成每个 Demo 和 PoC 的必填检查表。",
        (
            action("明确 AI 的允许与禁止动作", "治理卡", "AI 可以分析、解释、推荐、预警、草拟、分类、总结；不可以自动高风险财务动作。", ["列允许动作", "列禁止动作", "写责任边界"], "AI 动作边界卡", "给每个用例标注 AI action type。", "不会出现自动付款、自动放行等越界设计。"),
            action("执行最小权限原则", "权限卡", "AI 只能读取当前任务所需最小数据。", ["定义用户角色", "定义数据范围", "定义字段级脱敏"], "Least Privilege 卡", "为 AR Demo 设计权限范围。", "AI 不返回用户本不该看的数据。"),
            action("执行 Human-in-the-loop 原则", "流程卡", "高风险输出必须人工确认。", ["识别高风险输出", "指定审核人", "记录人工决定"], "Human-in-the-loop 卡", "为会计分录草稿设计审批流。", "所有高风险建议都有人工确认点。"),
            action("设计审计可追溯原则", "审计卡", "所有 AI 请求可追踪、复核、还原、审计。", ["记录 user、role、system、data scope、prompt version、model、confidence、human decision"], "审计追踪卡", "用 Demo 生成一条审计日志样例。", "审计员能复盘 AI 输出来源。"),
            action("执行权责分离原则", "SoD 卡", "AI 不得打破 Authorization、GRC、SoD、Workflow、审批链。", ["列职责冲突", "限制 AI service user", "保留审批链"], "SoD 控制卡", "检查付款建议场景。", "AI 不同时拥有建议与批准权。"),
            action("分类 Finance AI 风险等级", "风险卡", "区分报表说明、关账解释、科目推荐、付款释放、银行主数据等风险。", ["列用例", "判定风险等级", "指定控制强度"], "风险等级分类卡", "每个用例先评级后设计。", "高风险场景不会采用低风险控制。"),
            action("识别敏感数据", "数据卡", "覆盖财务交易、主数据、银行与付款数据。", ["列 BKPF/BSEG/ACDOCA 等交易数据", "列 Vendor/Customer/G/L 等主数据", "列 IBAN/SWIFT/Bank Account"], "敏感数据卡", "为每个字段标注是否脱敏。", "不把敏感数据放进通用 Prompt。"),
            action("建立权限风险清单", "权限卡", "检查 AI service user 权限过大、越权、跨公司代码、SoD、API/Fiori 不一致、Prompt Injection。", ["逐项检查", "写缓解措施", "写测试案例"], "权限风险卡", "用治理审查问题模拟客户追问。", "能向 IT/内控解释控制方式。"),
            action("建立角色权限矩阵", "权限卡", "定义普通财务、AP、GL、Manager、Treasury、Auditor、AI Admin 权限。", ["列可读数据", "列可执行动作", "列禁止动作"], "角色权限矩阵卡", "每个 Demo 标注目标角色。", "角色权限边界清楚。"),
            action("识别 AI 输出风险", "风险卡", "覆盖幻觉、错误会计判断、错误金额、过度自信、Prompt Injection、数据泄露。", ["列输出风险", "设置信心阈值", "设计校验和人工复核"], "AI 输出风险卡", "用错误样例测试 Prompt。", "AI 输出不会无条件成为最终结论。"),
            action("设计标准 Human-in-the-loop 流程", "流程卡", "用户请求、权限检查、脱敏、AI 建议、规则检查、人工确认、Workflow、日志。", ["画流程", "标注系统", "标注人工角色"], "HITL 标准流程卡", "和 BTP Agent 结合成架构图。", "流程可用于售前和 PoC 文档。"),
            action("编写 AI 使用政策草案", "政策卡", "形成 10 条企业级 AI 使用规则。", ["AI 辅助不替代审批", "不绕过权限", "敏感数据脱敏", "Prompt/模型变更纳入管理"], "AI 使用政策卡", "用于客户说明附件。", "政策保守、可审计、可执行。"),
            action("准备客户说明话术", "售前卡", "向客户说明不会设计超级权限财务机器人。", ["说明 AI 不做什么", "说明 AI 只能做什么", "说明控制机制"], "治理客户话术卡", "生成日语正式版。", "客户听完知道责任仍由 SAP Workflow / GRC / 审批人控制。"),
        ),
    ),
    Coach(
        "09_japanese_presales",
        "09_japanese_presales.md",
        "日本SAP项目沟通与售前表达训练.md",
        "09_japanese_presales_life_coach.md",
        "日语商务沟通与售前人生教练",
        "我作为日语售前导师，负责把 SAP × AI 复杂概念变成日本客户会议中自然、保守、有顾问感的表达。",
        "源文件围绕“不是单纯导入 AI 工具，而是结合 SAP 流程识别财务 AI 场景”给出自然日语、正式版、顾问式版、客户追问、推荐回答和训练方向。",
        "增强重点：把单句表达扩展成可反复训练的会议话术、问答和 Workshop 模板。",
        (
            action("把中文原意改成自然日文", "表达卡", "让表达符合日本客户会议语境。", ["保留 SAP 業務プロセス", "强调効率化和意思決定の高度化", "避免直译"], "自然日文表达卡", "每天改写 1 句中文顾问表达。", "日语自然，不像翻译腔。"),
            action("生成正式版本", "表达卡", "用于提案书、会议纪要和正式说明。", ["使用 本取り組み", "使用 整合性を踏まえた上で", "强调目的"], "正式日文表达卡", "把 Demo 说明转成正式版。", "适合写入客户资料。"),
            action("生成顾问式版本", "表达卡", "把焦点从导入 AI 转向共同识别业务判断点。", ["强调ポイント", "强调どこに入れるかではなく", "强调一緒に見極める"], "顾问式表达卡", "用于 Workshop 开场。", "听起来像引导客户思考，而不是推销工具。"),
            action("准备客户追问回答", "问答卡", "回答“具体能用在哪些业务”。", ["先说现实切入", "举请求書、入金消込、経費、月次決算、予実分析", "再说优先级判断标准"], "客户追问 Q&A 卡", "模拟客户质疑 3 轮。", "回答具体且不夸大。"),
            action("准备会议开场句", "会议卡", "用于 AI Workshop 或客户访谈。", ["说明今天不是讨论技术本身", "说明要整理 SAP 流程中 AI 容易产生效果的地方", "引导确认高负荷、耗时、属人化部分"], "会议开场话术卡", "录音练习 3 次。", "能自然开启讨论。"),
            action("积累日本 SAP 高频表达", "词汇卡", "掌握現状整理、課題認識、業務影響、Fit & Gap、今後の進め方等词。", ["每个词写中文含义", "写使用场景", "写例句"], "SAP 会议词汇卡", "每周造 10 句。", "会议中能主动使用。"),
            action("积累 SAP × AI 关键词日语", "词汇卡", "掌握 AIガバナンス、権限制御、監査ログ、人による確認、データ品質等。", ["列中日对照", "写风险说明例句"], "SAP AI 日语关键词卡", "和治理 Agent 联合输出日语说明。", "能解释治理而不是只说 AI。"),
            action("训练客户会议改写", "训练卡", "把中文想法改成日本客户会议自然表达。", ["输入中文", "生成自然版", "生成正式版", "生成顾问式版", "写使用场景"], "会议改写训练卡", "用 10 个真实但脱敏句子训练。", "每句都能直接复制到会议准备材料。"),
            action("模拟客户质疑", "训练卡", "训练 AI 结果错误、安全、成本、责任边界等追问。", ["列客户质疑", "写短答", "写详细答", "写下一步确认事项"], "客户质疑训练卡", "每周模拟 3 个 Q&A。", "回答保守、有边界、有下一步。"),
            action("设计日文 Workshop 流程", "Workshop 卡", "输出 SAP AI Workshop 的日文流程。", ["开场", "现状整理", "痛点识别", "AI 场景优先级", "风险说明", "下一步"], "日文 Workshop 流程卡", "做 30 分钟试讲。", "流程能引导客户共同产出场景地图。"),
        ),
    ),
    Coach(
        "10_course_productization",
        "10_course_productization.md",
        "SAP_FICO_AI_知识产品化与课程设计方案.md",
        "10_course_productization_life_coach.md",
        "知识产品化与课程设计人生教练",
        "我作为课程设计导师，负责把 SAP FICO、AI、日本项目经验转成训练营、文章、模板、案例和企业内训。",
        "源文件给出 6 周训练营，从能力诊断、FICO 全景、FI、CO、日本文档沟通、AI 工作流到知识产品化，并列出案例库、模板库、内容方向和商业化路径。",
        "增强重点：让每一周课程都有学习目标、案例、作业、模板和最小交付成果。",
        (
            action("定义主课程定位", "课程卡", "面向在日华人顾问，训练 S/4HANA Finance 项目能力与 AI 实战。", ["写课程名称", "写核心定位", "写能力升级路径"], "课程定位卡", "用定位 Agent 检查市场表达。", "课程不是泛 AI，而是 FICO 项目能力升级。"),
            action("定义目标学员", "画像卡", "区分初级顾问、转职者、在日华人顾问、中级顾问。", ["列痛点", "列学习需求", "列适合课程模块"], "学员画像卡", "访谈 3 个潜在学员验证。", "每类学员都有明确收益。"),
            action("定义训练营总体目标", "课程卡", "学员结束后能理解流程、分析场景、写项目文档、用 AI 辅助工作、日语沟通、产品化经验。", ["列 6 个目标", "写验收方式"], "训练营目标卡", "每个目标配一个作业。", "目标可检查，不是口号。"),
            action("设计第 0 周能力诊断", "训练卡", "让学员了解短板并建立学习目标。", ["讲项目角色结构", "讲 FICO 顾问能力模型", "准备 AI 工具", "完成诊断表"], "第0周课程卡", "做自己的诊断表样例。", "学员完成能力诊断和路线规划。"),
            action("设计第 1 周 FICO 项目全景", "训练卡", "建立项目整体视角。", ["讲 FICO 主流程", "讲项目生命周期", "讲 S/4HANA Finance 概览", "绘制项目流程图"], "第1周课程卡", "用客户导入 S/4 场景教学。", "学员交付 FICO 项目流程图。"),
            action("设计第 2 周 FI 场景实战", "训练卡", "掌握 GL/AP/AR/AA/Bank/Closing 核心流程。", ["讲 FI 模块", "设计月结 Checklist", "写 AP 测试脚本"], "第2周课程卡", "产出 FI 月结 Checklist。", "学员能写 AP 测试脚本和月结任务清单。"),
            action("设计第 3 周 CO 场景实战", "训练卡", "理解 Cost Center、Internal Order、Profit Center、Allocation。", ["讲 CO 逻辑", "做成本中心结构设计", "写分摊规则说明"], "第3周课程卡", "用制造业成本中心案例。", "学员能解释成本中心与分摊规则。"),
            action("设计第 4 周日本项目文档与沟通", "训练卡", "提升要件定義、基本設計、テスト仕様書、課題管理、議事録能力。", ["讲日语项目文档", "写议事录", "写课题票"], "第4周课程卡", "用日语售前 Agent 生成模板。", "学员交付日语议事录和課題票。"),
            action("设计第 5 周 SAP FICO × AI 工作流", "训练卡", "让 AI 成为顾问助手。", ["讲 Prompt 工程", "AI 问题分析", "AI 文档生成", "AI 测试设计"], "第5周课程卡", "建立 Prompt 库。", "学员交付 AI 测试脚本生成样例。"),
            action("设计第 6 周知识产品化", "训练卡", "把项目经验变成文章、短视频、模板库、训练营和内训。", ["讲文章结构", "讲模板库", "讲课程销售页", "完成案例文章"], "第6周课程卡", "写一页课程销售页。", "学员有一篇案例文章和短视频选题。"),
            action("建立案例库", "案例卡", "沉淀 AP 自动付款、AR 清账、AA 折旧、CO 分摊、月结延迟、集成问题等案例。", ["列案例", "写问题", "写行动", "写教学点"], "课程案例库卡", "每周新增一个案例。", "案例可脱敏用于教学。"),
            action("设计模板库产品", "产品卡", "输出项目流程图、AP 测试脚本、FI 月结 Checklist、CO 访谈、日语议事录、AI Prompt 模板库。", ["列模板", "写使用场景", "写交付格式"], "模板库产品卡", "优先做 3 个 MVP 模板。", "模板能独立销售或作为课程作业。"),
            action("规划内容发布方向", "内容卡", "把课程内容转成文章和短视频选题。", ["列文章标题", "列短视频标题", "标注对应课程周"], "内容选题卡", "每周发布 1 条。", "内容服务课程转化。"),
            action("设计商业化路径", "商业卡", "从免费内容到模板包、小课、训练营、企业内训、1 对 1。", ["列价格层级", "列入口产品", "列升级产品"], "课程商业化路径卡", "和商业化 Agent 联合定价。", "每个产品有明确交付物。"),
        ),
    ),
    Coach(
        "11_certification_roadmap",
        "11_certification_roadmap.md",
        "SAP_AI_Certification_Roadmap.md",
        "11_certification_roadmap_life_coach.md",
        "认证与学习路线人生教练",
        "我作为认证路线导师，负责让证书服务定位、项目能力和内容资产，而不是盲目考证。",
        "源文件基于 2026-05-23 的路线判断，建议 FI → SAP GenAI → BTP Architect，并强调认证要转成项目任务、练习系统和场景判断。",
        "增强重点：把认证计划拆成 12 个月路线、30/60/90 天计划、每周任务、内容资产和证书评分规则。",
        (
            action("确定 12 个月主认证顺序", "路线卡", "先 FI 硬核可信度，再 SAP GenAI 差异化，最后 BTP Architect 架构高度。", ["评估现金流", "评估时间", "选择 1-3 个证书"], "认证主线卡", "每季度复核一次证书是否仍有效。", "路线不超过 3 个主证书。"),
            action("制定替代策略", "决策卡", "根据预算和基础选择只考 FI、FI+GenAI、延后 BTP 或补 SAP Build / PL-300。", ["列预算状态", "列替代证书", "写取舍理由"], "认证替代策略卡", "用 30 分评分规则复核。", "不会因证书焦虑分散主线。"),
            action("评估 S/4HANA FI 认证价值", "知识卡", "把 FI 认证作为主信用锚点。", ["连接组织结构、主数据、GL/AP/AR/AA、月结年结", "转成项目训练素材"], "FI 认证价值卡", "把学习笔记转成课程大纲。", "能说明证书如何服务日本项目。"),
            action("评估 SAP Generative AI Developer 价值", "知识卡", "把 SAP GenAI 认证作为 Business AI 差异化。", ["学习 Business AI / LLM / GenAI Hub / Prompt Registry / Grounding", "转成 FI × AI Demo"], "GenAI 认证价值卡", "做月结问答助手或测试脚本助手。", "不是泛 AI，而是 SAP 企业 AI。"),
            action("评估 BTP Solution Architect 价值", "知识卡", "用 BTP Architect 建立 Clean Core、扩展、集成和 AI 架构高度。", ["学习 account model、services、Clean Core、Integration、Security", "做 3 个架构案例"], "BTP 认证价值卡", "用架构答辩训练。", "知道 BTP 不适合零基础硬冲。"),
            action("制定 12 个月备考路线", "路线卡", "月份 1-3 FI、4-6 GenAI、7-11 BTP、12 产品化。", ["每月指定主任务", "每月指定交付物"], "认证 12 个月路线卡", "纳入周计划。", "每月都有认证学习和内容资产。"),
            action("执行 FI 30/60/90 天计划", "训练卡", "30 天知识骨架、60 天项目场景、90 天考试与内容化。", ["画 FI 流程图", "做模块场景题", "写错题本和文章"], "FI 90 天计划卡", "每周完成 1 个模块。", "90 天结束可考试或 readiness review。"),
            action("执行 GenAI 30/60/90 天计划", "训练卡", "30 天掌握 Business AI / LLM / Hub，60 天做 FI × AI Demo，90 天系统任务训练。", ["学 prompt/model/grounding", "设计月结助手", "整理 Prompt Registry 框架"], "GenAI 90 天计划卡", "用 Demo 验证学习。", "有可展示 AI 工作流。"),
            action("执行 BTP 30/60/90 天计划", "训练卡", "30 天架构地图、60 天 3 个案例、90 天答辩能力。", ["学 account model / Clean Core", "设计 FI 自动化、财务 AI、跨系统集成", "练成本和安全说明"], "BTP 90 天计划卡", "每个案例写 ADR。", "能讲架构取舍而非背服务名。"),
            action("使用原创练习题", "训练卡", "用 FI、GenAI、BTP 场景题训练项目判断。", ["每周选 3 题", "先独立作答", "再用 Agent 纠偏"], "认证练习题卡", "把错题转成知识卡。", "答案基于项目逻辑，不复刻题库。"),
            action("执行每周固定节奏", "执行卡", "4-5 小时官方学习、2-3 小时场景题/hands-on、1-2 小时公开笔记、1 小时日语项目语境。", ["安排时间块", "记录输出物", "周复盘检查"], "认证周节奏卡", "固定每周一次输出公开笔记。", "学习时间转成文章、模板或 Demo。"),
            action("将备考转成内容资产", "产品化卡", "每个证书对应文章、课程模块和模板资产。", ["FI 转流程图和 checklist", "GenAI 转 prompt template 和 use case canvas", "BTP 转 Clean Core 判断树和 ADR"], "认证内容资产卡", "优先做 5 个公开内容。", "备考不只是通过考试。"),
            action("使用证书 30 分评分规则", "决策卡", "从定位匹配、项目价值、内容资产、市场可信度、学习成本、时效风险判断是否投入。", ["给每项 1-5 分", "写结论", "写是否纳入主线"], "认证评分卡", "看到新证书先评分。", "低于 20 分不进入本季度主线。"),
        ),
    ),
    Coach(
        "12_business_model",
        "12_business_model.md",
        "SAP_FICO_AI_商业化服务产品菜单_V1.md",
        "12_business_model_life_coach.md",
        "商业化与产品设计人生教练",
        "我作为商业化导师，负责把 SAP FICO × AI 经验从按天卖工时升级为模板、课程、内训、诊断、PoC 和长期顾问服务。",
        "源文件给出 8 个服务产品、三阶段主打组合、销售页结构、客户访谈题库、月结异常 PoC、资产转产品表和 14 天行动计划。",
        "增强重点：把产品菜单拆成可验证的商业实验，先做入口产品和诊断会，再升级高价 PoC。",
        (
            action("建立服务产品阶梯", "商业卡", "从模板库到长期顾问服务形成价格和信任阶梯。", ["列入门、低价、中价、企业、高价、PoC、长期", "写目的"], "服务阶梯卡", "选择 1 个入口、1 个现金流、1 个高价产品。", "不同时销售 8 个产品。"),
            action("设计 SAP FICO AI 模板库", "产品卡", "作为低价入口产品验证市场。", ["做 10 条 Prompt", "做 3 个 Excel 诊断表", "做 1 个 Demo 脚本", "写 1 页销售页"], "模板库产品卡", "发给 20 个顾问验证。", "收集愿付价格和最想要模板类型。"),
            action("设计 SAP FICO 顾问 AI 提效小课", "产品卡", "用 90 分钟公开课或 4 节小课建立信任。", ["设计 4 课主题", "准备 Prompt 手册", "准备作业点评"], "AI 提效小课卡", "先开公开课测试转化。", "能从免费内容转到 ¥199/¥999/训练营。"),
            action("设计 SAP FICO AI 实战训练营", "产品卡", "4 周交付场景地图、交付模板、Demo 和服务菜单。", ["第 1 周场景地图", "第 2 周交付物生成", "第 3 周 Demo", "第 4 周产品化"], "实战训练营卡", "先招募 10-20 个 Beta 学员。", "学员必须完成作品。"),
            action("设计企业财务团队 AI 工作坊", "产品卡", "进入 B2B 预算，帮财务团队识别 AI 场景。", ["设计 1 天/2 天/4 周版", "准备场景清单", "准备 Prompt 手册", "准备 PoC 候选清单"], "企业工作坊卡", "访谈财务、IT、Key User。", "交付物能进入管理层汇报。"),
            action("设计 SAP FICO AI 场景诊断咨询", "产品卡", "从培训升级为咨询，帮助客户选对场景。", ["访谈关键用户", "梳理流程痛点", "识别 AI 场景", "排序优先级", "输出 PoC 路线"], "场景诊断咨询卡", "先做 90 分钟诊断会。", "诊断会后能卖完整报告。"),
            action("设计 SAP 财务 AI PoC 试点项目", "产品卡", "用 4-8 周验证一个高价值财务 AI 场景。", ["定义场景", "设计数据样例", "做 Demo 原型", "设计权限和安全", "用户测试", "评估成功标准"], "PoC 试点卡", "优先选月结异常分析助手。", "指标能证明是否值得正式项目。"),
            action("设计售前方案包", "产品卡", "卖给咨询公司和售前团队。", ["销售 PPT", "3-5 个 Demo 脚本", "客户访谈表", "报价模板", "ROI 模板"], "售前方案包卡", "访谈 3 家小型 SAP 咨询公司。", "客户愿意为赢单资产付费。"),
            action("设计个人高端顾问服务", "产品卡", "服务资深顾问的定位、产品、内容、资产、销售和转化。", ["做个人商业化诊断", "设计服务菜单", "写销售页", "陪跑试点客户"], "私人顾问服务卡", "先做 5 个免费深访。", "可以销售诊断版或共创版。"),
            action("选择主打产品组合", "决策卡", "按 0-30、30-90、90-180 天分阶段推进。", ["阶段一模板库+小课+诊断", "阶段二训练营+工作坊+PoC", "阶段三售前包+私人顾问+retainer"], "主打组合卡", "每 30 天复盘一次。", "始终有入口、现金流、高价产品。"),
            action("编写销售页结构", "销售卡", "为 SAP FICO AI 实战训练营写标题、副标题、适合谁、获得什么、模块、价格、成交主张。", ["按结构写草稿", "加入作品截图", "加入 Beta 价格"], "销售页结构卡", "用定位 Agent 检查语言。", "销售页能直接发给潜在学员。"),
            action("执行企业客户访谈", "访谈卡", "验证财务流程、AI 认知预算、SAP 场景和 PoC 意愿。", ["问 ECC/S4 状态", "问痛点模块", "问预算", "问 PoC 成功标准"], "企业访谈题库卡", "访谈 3 类人。", "访谈后能判断是否卖诊断或 PoC。"),
            action("执行个人顾问访谈", "访谈卡", "验证顾问商业化障碍和付费意愿。", ["问收入方式", "问擅长模块", "问案例资产", "问愿买产品", "问 90 天目标"], "个人顾问访谈卡", "访谈 5 位顾问。", "输出个人商业化诊断图。"),
            action("设计月结异常 PoC 试点", "PoC 卡", "以月结异常分析助手作为企业高价产品切入。", ["梳理月结流程", "收集脱敏异常", "设计 Prompt", "做 Demo", "用户测试", "管理层汇报"], "月结异常 PoC 卡", "准备 3 个脱敏异常案例。", "能约企业财务负责人测试意愿。"),
            action("执行 14 天行动计划", "行动卡", "用两周做出模板库 MVP、销售页、访谈、公开课和第一次销售。", ["第1-2天整理 10 个案例", "第3-4天选 5 个 AI 场景", "第5-6天做 10 Prompt 和 3 模板", "第7天销售页", "第8-10天访谈", "第11天公开课大纲", "第12天预热", "第13天分享", "第14天销售"], "14 天商业行动卡", "每天只做当天动作。", "第 14 天有真实销售动作。"),
        ),
    ),
    Coach(
        "13_weekly_review",
        "13_weekly_review.md",
        "每周复盘与执行教练.md",
        "13_weekly_review_life_coach.md",
        "周复盘与执行人生教练",
        "我作为周复盘教练，负责把学习、项目、内容、Demo、认证、商业化六条线压成可评分、可删除、可继续的下周 3 目标。",
        "源文件最重要的原则是：学了不算，做出来才算。每周必须检查真实产出、未完成原因、应该删除的任务、下周 3 任务和最小交付。",
        "增强重点：把周复盘变成执行系统，防止学习很多、输出很少。",
        (
            action("确认长期目标与原则", "原则卡", "所有复盘服务 SAP FICO × Business AI × 日本项目实战训练导师。", ["读长期目标", "确认本周产出是否服务目标", "删除不服务目标的任务"], "周复盘原则卡", "每周复盘开头先读目标。", "不会用学习时长冒充成果。"),
            action("复盘 6 个方向", "复盘卡", "学习、项目、内容、Demo、认证、商业化逐项检查。", ["每个方向列具体产出", "没有产出就写无", "标注资产化可能"], "六方向复盘卡", "每周至少一个方向有资产。", "复盘完整但不扩散。"),
            action("回答完成了什么具体产出", "复盘卡", "禁止只写学了很多。", ["列文件、Demo、文章、题目、服务页", "写路径或摘要"], "具体产出卡", "每个产出附链接或位置。", "能被检查。"),
            action("分析未完成任务原因", "诊断卡", "区分时间、能力、目标太大、分心、逃避输出。", ["列任务", "写原因", "归类问题类型", "写下次修正"], "未完成原因卡", "每周只修正一个最大原因。", "原因不是自责，而是系统改进。"),
            action("删除应该删除的任务", "决策卡", "砍掉无意义学习、工具焦虑、收藏不整理、重复研究、伪忙碌。", ["列候选删除项", "写删除理由", "写释放出的时间"], "任务删除卡", "下周计划前先删除。", "至少删除一个不产生资产的任务。"),
            action("确定下周 3 个核心任务", "计划卡", "限制在 3 个以内，少而精。", ["每个任务对应长期目标", "每个任务有输出物", "每个任务可验收"], "下周 3 目标卡", "用 weekly 命令生成计划。", "没有第 4 个核心任务。"),
            action("定义每个任务最小完成标准", "验收卡", "确保任务可验证、可检查、可交付。", ["写最小文件/截图/文章/Prompt/题数", "写完成判定", "写截止时间"], "最小完成标准卡", "周五预检查。", "每个任务都有验收口径。"),
            action("给本周完成度评分", "评分卡", "按真实产出、长期目标、资产化、聚焦、商业化评分。", ["给 10 分制评分", "写扣分原因", "写下周修正"], "完成度评分卡", "每月看评分趋势。", "评分不靠感觉。"),
            action("总结本周最大进展", "复盘卡", "识别最有长期价值的成果。", ["选择一个成果", "说明为什么有价值", "写如何复用"], "最大进展卡", "把进展转成输出 tracker。", "不是列流水账。"),
            action("总结本周最大问题", "复盘卡", "找出学习过量、没有输出、任务分散、Demo 太复杂、没有商业化动作等问题。", ["选择最大问题", "写触发原因", "写下周防线"], "最大问题卡", "每周只解决一个系统问题。", "问题能转成行动规则。"),
            action("填写下周汇报模板", "模板卡", "统一记录学习、项目、内容、Demo、认证、商业化。", ["填写完成产出", "填写没完成", "填写删除项", "填写下周 3 目标", "填写风险和避免事项"], "下周汇报模板卡", "周日固定生成。", "可以直接复制给复盘 Agent。"),
        ),
    ),
)


def slug_card_id(coach_index: int, action_index: int) -> str:
    return f"LC-{coach_index:02d}-{action_index:03d}"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def relative_from(path: Path, base: Path) -> str:
    return path.relative_to(base).as_posix()


def generate_card(coach: Coach, coach_index: int, action_index: int, item: Action) -> tuple[str, str]:
    card_id = slug_card_id(coach_index, action_index)
    card_path = CARDS_DIR / f"{card_id}.md"
    enhanced_path = ENHANCED_DIR / coach.enhanced_file
    source_path = SOURCE_DIR / coach.source_file
    steps = "\n".join(f"{i}. {step}" for i, step in enumerate(item.steps, start=1))
    text = f"""# {card_id}｜{item.title}

## 卡片类型

{item.card_type}

## 对应 Agent

{coach.agent_id}｜{coach.name}

## 来源

- 原始文件：[{coach.source_file}](../../imported/life-os/人生教练/{coach.source_file})
- 增强方案：[{coach.enhanced_file}](../enhanced/{coach.enhanced_file})

## 目标

{item.goal}

## 具体动作

{steps}

## 信息 / 知识补充

- 先确认本动作服务长期定位：SAP FICO × Business AI × 日本项目实战训练导师。
- 若涉及客户、项目、财务数据，只能使用脱敏信息或模拟数据。
- 若涉及 AI 输出，高风险结论必须保留人工确认与审计边界。

## 训练方式

{item.training}

## 输出物

{item.output}

## 验收标准

{item.acceptance}

## 回链

- [返回增强方案](../enhanced/{coach.enhanced_file})
- [返回人生教练索引](../coach_index.md)
"""
    write(card_path, text)
    return card_id, card_path.name


def generate_enhanced(coach: Coach, coach_index: int) -> list[tuple[str, str, str]]:
    card_rows: list[tuple[str, str, str]] = []
    for action_index, item in enumerate(coach.actions, start=1):
        card_id, card_file = generate_card(coach, coach_index, action_index, item)
        card_rows.append((card_id, item.title, card_file))

    rows = "\n".join(
        f"| {i} | {title} | [{card_id}](../cards/{card_file}) |"
        for i, (card_id, title, card_file) in enumerate(card_rows, start=1)
    )
    action_plan = "\n".join(
        f"{i}. {title}"
        for i, (_card_id, title, _card_file) in enumerate(card_rows, start=1)
    )
    text = f"""# {coach.name}

## 来源与处理状态

- 对应 Agent：[{coach.agent_file}](../../../agents/{coach.agent_file})
- 原始文件：[{coach.source_file}](../../imported/life-os/人生教练/{coach.source_file})
- 处理方式：已作为专项教练重新理解，并拆成增强方案与动作卡片。

## 我作为本文件 Agent 的理解

{coach.identity}

{coach.understanding}

## 增强后的方案

{coach.improvement}

本方案的执行顺序如下：

{action_plan}

## 动作 / 知识 / 训练卡片

| 序号 | 动作 | 卡片 |
| ---: | --- | --- |
{rows}

## 使用方法

1. 先阅读本增强方案，确认今天或本周要推进哪一个动作。
2. 打开对应卡片，按“具体动作”和“训练方式”执行。
3. 将输出物保存到 `outputs/` 或本项目对应日志。
4. 下次调用 Agent 时，把已完成输出物和卡片编号一起汇报。

## 下次调用 Prompt

```text
请你作为“{coach.name}”继续辅导我。
我当前正在执行的卡片是：<填写卡片编号>。
我已经完成的输出物是：<填写文件或摘要>。
我遇到的阻碍是：<填写阻碍>。
请你检查我的输出物是否达到验收标准，并给出下一步最小行动。
```
"""
    write(ENHANCED_DIR / coach.enhanced_file, text)
    return card_rows


def generate_index(all_rows: list[tuple[Coach, list[tuple[str, str, str]]]]) -> None:
    summary_rows = "\n".join(
        f"| {coach.agent_id} | {coach.name} | [{coach.source_file}](../imported/life-os/人生教练/{coach.source_file}) | [{coach.enhanced_file}](enhanced/{coach.enhanced_file}) | {len(cards)} |"
        for coach, cards in all_rows
    )
    text = f"""# 人生教练整合索引

本目录把 `/Users/openclawxiaoer/Documents/OpenClaw/life-os/人生教练` 中的 14 个 Markdown 文件合并进 `sap-ai-mentor-os`。

处理原则：

- 保留原始拷贝：`knowledge/imported/life-os/人生教练/`
- 为每个源文件生成一个增强方案：`knowledge/life_coach/enhanced/`
- 为每个具体步骤和动作生成卡片：`knowledge/life_coach/cards/`
- 把每个现有 Agent 文件回链到对应增强方案。

| Agent | 人生教练 | 原始文件 | 增强方案 | 卡片数 |
| --- | --- | --- | --- | ---: |
{summary_rows}

## 卡片使用规则

1. 每次只选择 1-3 张卡片执行。
2. 每张卡片必须产出一个可检查成果。
3. 涉及客户、项目、财务、个人数据时，只使用脱敏或模拟信息。
4. 周复盘时用卡片编号汇报完成情况。
"""
    write(OUTPUT_DIR / "coach_index.md", text)

    readme = """# Life Coach Knowledge Layer

这里是 `life-os/人生教练` 与 `sap-ai-mentor-os` 合并后的增强层。

- `coach_index.md`：14 个专项教练的总索引。
- `enhanced/`：逐个源文件处理后的增强方案。
- `cards/`：每个步骤和具体动作对应的信息、知识、训练、行动卡片。

原始拷贝保存在 `knowledge/imported/life-os/`，不要直接修改源快照；如需迭代，请改增强方案或新增卡片。
"""
    write(OUTPUT_DIR / "README.md", readme)


def generate_registry(all_rows: list[tuple[Coach, list[tuple[str, str, str]]]]) -> None:
    lines = ["life_coach_sources:"]
    for coach, cards in all_rows:
        lines.extend(
            [
                f"  - agent_id: {coach.agent_id}",
                f"    agent_file: agents/{coach.agent_file}",
                f"    source_file: knowledge/imported/life-os/人生教练/{coach.source_file}",
                f"    enhanced_plan: knowledge/life_coach/enhanced/{coach.enhanced_file}",
                f"    card_count: {len(cards)}",
            ]
        )
    write(ROOT / "config" / "life_coach_registry.yaml", "\n".join(lines))


def update_agent_links(coach: Coach) -> None:
    path = AGENTS_DIR / coach.agent_file
    text = path.read_text(encoding="utf-8")
    marker = "## 人生教练整合来源"
    block = f"""{marker}

- 原始人生教练文件：[{coach.source_file}](../knowledge/imported/life-os/人生教练/{coach.source_file})
- 增强方案：[{coach.enhanced_file}](../knowledge/life_coach/enhanced/{coach.enhanced_file})
- 卡片总索引：[人生教练整合索引](../knowledge/life_coach/coach_index.md)

使用要求：调用本 Agent 时，优先参考增强方案中的动作卡片，把建议落实到具体输出物、训练动作和下次汇报。
"""
    if marker in text:
        text = text.split(marker)[0].rstrip() + "\n\n" + block
    else:
        text = text.rstrip() + "\n\n" + block
    write(path, text)


def main() -> None:
    ENHANCED_DIR.mkdir(parents=True, exist_ok=True)
    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    all_rows: list[tuple[Coach, list[tuple[str, str, str]]]] = []
    for coach_index, coach in enumerate(COACHES):
        source_path = SOURCE_DIR / coach.source_file
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        cards = generate_enhanced(coach, coach_index)
        update_agent_links(coach)
        all_rows.append((coach, cards))
    generate_index(all_rows)
    generate_registry(all_rows)
    total_cards = sum(len(cards) for _coach, cards in all_rows)
    print(f"generated {len(all_rows)} enhanced plans and {total_cards} cards")


if __name__ == "__main__":
    main()

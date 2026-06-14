"""SAPKB 合规门禁（Cowork-Worker 认知模块）

职责：对每条采集记录盖 import_mode / rights_status / confidence_tier，
命中付费/登录/cookie/验证码等特征 → blocked，并产出可落 audit_logs 的审计结论。

红线（docs/04 / routing_policy_v2）：
- 默认 metadata_only；外部采集一律 confidence_tier = reference。
- 全文落地必须满足授权条件之一（user_imported / license_purchased / own_content）。
- 任何登录/cookie/验证码/付费墙特征 → blocked，绝不入全文。
"""
from __future__ import annotations

from typing import Any, Dict, List

# 硬拦截特征：登录/cookie/验证码——无法合规获取，直接 blocked。
HARD_BLOCK_SIGNALS = [
    "扫码登录", "微信登录", "请登录", "登录后", "登录查看",
    "cookie", "captcha", "验证码", "滑块验证",
]
# 付费墙特征：内容本身可买，**不硬拦**——元数据照收，标 needs_license，
# 产“待付费提醒”让 Ryan 决定是否去付费解锁全文（用户 2026-06-10 指令）。
PAYWALL_SIGNALS = [
    "付费阅读", "付费查看", "vip专享", "vip 专享", "会员专享", "开通会员",
    "知识星球", "充值后", "解锁全文", "付费专栏", "订阅专栏",
]
# 向后兼容旧引用
BLOCK_SIGNALS = HARD_BLOCK_SIGNALS + PAYWALL_SIGNALS

# import_mode → rights_status 映射
_MODE_TO_RIGHTS = {
    "metadata_only": "metadata_only",
    "summary_only": "summary_only",
    "fulltext_user_imported": "user_imported",
    "license_purchased": "license_purchased",
    "own_content": "own_content",
}

# 全文允许落地的 rights（其余只能存元数据/摘要）
_FULLTEXT_RIGHTS = {"user_imported", "license_purchased", "own_content", "fulltext_allowed"}


def evaluate(record: Dict[str, Any], source_cfg: Dict[str, Any]) -> Dict[str, Any]:
    """对一条记录做合规判定。

    返回 dict：
      import_mode / rights_status / confidence_tier / blocked(bool) /
      allow_fulltext(bool) / audit(dict 可落 audit_logs)
    """
    import_mode = (
        record.get("import_mode")
        or (source_cfg or {}).get("import_mode")
        or "metadata_only"
    )
    rights = _MODE_TO_RIGHTS.get(import_mode, "unknown")

    blob = " ".join([
        str(record.get("source_url") or ""),
        str(record.get("title") or ""),
        str(record.get("summary") or ""),
    ]).lower()

    findings: List[str] = []
    hard_hits = [s for s in HARD_BLOCK_SIGNALS if s.lower() in blob]
    pay_hits = [s for s in PAYWALL_SIGNALS if s.lower() in blob]
    for s in hard_hits:
        findings.append("hardblock:" + s)
    for s in pay_hits:
        findings.append("paywall:" + s)

    # 采集层绝不应带 body；带了说明上游违规，记为高风险（但不入库正文）
    if record.get("body") or record.get("content") or record.get("text"):
        findings.append("carries_fulltext_without_license")

    blocked = bool(hard_hits)                 # 仅登录/cookie/验证码硬拦
    needs_license = bool(pay_hits) and not blocked  # 付费墙：元数据照收，提醒付费

    # 全文放行需有授权 rights 且非硬拦、非待付费
    allow_fulltext = (rights in _FULLTEXT_RIGHTS) and not blocked and not needs_license

    if blocked:
        rights = "blocked"
        status, risk = "blocked", "high"
    elif needs_license:
        status, risk = "needs_payment", "medium"  # 待 Ryan 付费解锁全文
    else:
        status, risk = "pass", "low"

    audit = {
        "audit_type": "compliance_gate",
        "status": status,
        "risk_level": risk,
        "findings_json": {"reasons": findings, "import_mode": import_mode,
                          "paywall_signals": pay_hits},
    }
    return {
        "import_mode": import_mode,
        "rights_status": rights,
        "confidence_tier": "reference",  # 外部采集恒为 reference
        "blocked": blocked,
        "needs_license": needs_license,
        "allow_fulltext": allow_fulltext,
        "audit": audit,
    }

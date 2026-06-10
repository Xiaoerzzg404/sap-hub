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

# 命中即 blocked 的合规风险特征（标题/摘要/URL 任一出现）
BLOCK_SIGNALS = [
    "扫码登录", "微信登录", "请登录", "登录后", "登录查看",
    "cookie", "captcha", "验证码", "滑块验证",
    "付费阅读", "付费查看", "vip专享", "vip 专享", "会员专享", "开通会员",
    "知识星球", "充值后", "解锁全文",
]

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
    for sig in BLOCK_SIGNALS:
        if sig.lower() in blob:
            findings.append("signal:" + sig)

    # 采集层绝不应带 body；带了说明上游违规，记为高风险（但不入库正文）
    if record.get("body") or record.get("content") or record.get("text"):
        findings.append("carries_fulltext_without_license")

    blocked = any(f.startswith("signal:") for f in findings)

    # 即便 import_mode 声称可全文，缺少授权凭证时也不放行（凭证校验在 license 注册环节）
    allow_fulltext = (rights in _FULLTEXT_RIGHTS) and not blocked

    if blocked:
        rights = "blocked"

    audit = {
        "audit_type": "compliance_gate",
        "status": "blocked" if blocked else "pass",
        "risk_level": "high" if blocked else "low",
        "findings_json": {"reasons": findings, "import_mode": import_mode},
    }
    return {
        "import_mode": import_mode,
        "rights_status": rights,
        "confidence_tier": "reference",  # 外部采集恒为 reference
        "blocked": blocked,
        "allow_fulltext": allow_fulltext,
        "audit": audit,
    }

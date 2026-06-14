import { describe, expect, it } from "vitest";
import { weeklyReviewMetrics } from "@/lib/metrics";

describe("weeklyReviewMetrics", () => {
  it("能从数据中聚合 Dashboard 指标", () => {
    const now = new Date("2026-05-20T12:00:00");
    const result = weeklyReviewMetrics({
      now,
      contents: [{ createdAt: "2026-05-18T10:00:00" }, { createdAt: "2026-05-10T10:00:00" }],
      consultants: [
        { createdAt: "2026-05-19T10:00:00", recommendable: true },
        { createdAt: "2026-05-12T10:00:00", recommendable: true },
        { createdAt: "2026-05-18T11:00:00", recommendable: false }
      ],
      clientDemands: [
        { createdAt: "2026-05-18T10:00:00", status: "LEAD" },
        { createdAt: "2026-05-19T10:00:00", status: "INTERVIEWED" },
        { createdAt: "2026-05-20T10:00:00", status: "CONFIRMED" },
        { createdAt: "2026-05-11T10:00:00", status: "LEAD" }
      ],
      tasks: [
        { createdAt: "2026-05-18T10:00:00", status: "TODO" },
        { createdAt: "2026-05-18T10:00:00", status: "DONE" }
      ]
    });

    expect(result.newContentCount).toBe(1);
    expect(result.newLeadCount).toBe(1);
    expect(result.newConsultantCount).toBe(2);
    expect(result.newClientInterviewCount).toBe(1);
    expect(result.enterpriseOpportunityCount).toBe(3);
    expect(result.recommendableConsultantCount).toBe(2);
    expect(result.openTaskCount).toBe(1);
  });
});

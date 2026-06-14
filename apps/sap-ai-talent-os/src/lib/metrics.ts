export type MetricRecord = {
  createdAt: Date | string;
};

export type WeeklyMetricsInput = {
  now?: Date;
  contents: MetricRecord[];
  consultants: (MetricRecord & { recommendable?: boolean })[];
  clientDemands: (MetricRecord & { status?: string })[];
  tasks?: (MetricRecord & { status?: string })[];
};

export type WeeklyDashboardMetrics = {
  weekStart: Date;
  weekEnd: Date;
  newContentCount: number;
  newLeadCount: number;
  newConsultantCount: number;
  newClientInterviewCount: number;
  enterpriseOpportunityCount: number;
  recommendableConsultantCount: number;
  openTaskCount: number;
};

export function getWeekRange(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function inRange(record: MetricRecord, start: Date, end: Date) {
  const date = asDate(record.createdAt);
  return date >= start && date <= end;
}

export function weeklyReviewMetrics(input: WeeklyMetricsInput): WeeklyDashboardMetrics {
  const { weekStart, weekEnd } = getWeekRange(input.now);
  const weeklyDemands = input.clientDemands.filter((item) => inRange(item, weekStart, weekEnd));

  return {
    weekStart,
    weekEnd,
    newContentCount: input.contents.filter((item) => inRange(item, weekStart, weekEnd)).length,
    newLeadCount: weeklyDemands.filter((item) => item.status === "LEAD").length,
    newConsultantCount: input.consultants.filter((item) => inRange(item, weekStart, weekEnd)).length,
    newClientInterviewCount: weeklyDemands.filter((item) => item.status === "INTERVIEWED").length,
    enterpriseOpportunityCount: weeklyDemands.filter((item) =>
      ["LEAD", "INTERVIEWED", "CONFIRMED", "MATCHING"].includes(item.status ?? "")
    ).length,
    recommendableConsultantCount: input.consultants.filter((item) => item.recommendable).length,
    openTaskCount: input.tasks?.filter((item) => item.status !== "DONE").length ?? 0
  };
}

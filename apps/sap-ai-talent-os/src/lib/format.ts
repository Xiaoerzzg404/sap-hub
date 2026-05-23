export function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}

export function formatDateInput(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

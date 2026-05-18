export function stripMarkdown(input: string, maxLength = 220) {
  const text = input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[>|*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function parseMarkdownTable(markdown: string): string[][] {
  const rows = markdown
    .split(/\r?\n/)
    .filter((line) => /^\s*\|.*\|\s*$/.test(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
    );

  return rows.filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)));
}

export function sectionAfter(markdown: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^#{2,3}\\s+${escaped}[\\s\\S]*?(?=^#{2,3}\\s+|\\z)`, "m"));
  return match?.[0] ?? "";
}

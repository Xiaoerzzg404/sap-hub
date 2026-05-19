export type LibraryItemKind =
  | "glossary-master"      // 04 术语总表
  | "phrasebook-master"    // 05 句型总表
  | "roleplay-master"      // 06 RolePlay 合集
  | "teacher-handbook"     // 07 讲师手册
  | "student-handbook"     // 08 学生讲义
  | "quality-report";      // 10 质量审查报告

export type LibraryItem = {
  kind: LibraryItemKind;
  title: string;
  path: string;
  markdown: string;
  wordCount: number;
  visibility: "student" | "teacher" | "both";
};

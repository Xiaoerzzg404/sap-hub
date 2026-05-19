export type Assignment = {
  id: string;
  lessonId: string;
  type: "vocabulary" | "phrase" | "recording" | "consultant-output" | "text";
  title: string;
  prompt: string;
  status?: "not-started" | "in-progress" | "completed" | "pending-teacher-review";
};

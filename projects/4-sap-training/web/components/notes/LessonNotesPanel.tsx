"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  deleteLessonNote,
  getLessonNote,
  loadLessonNotes,
  saveLessonNote,
  type LessonNote,
} from "@/lib/lesson-notes-storage";
import type { Lesson } from "@/types/lesson";

export function LessonNotesPanel({
  lessons,
  initialLessonId,
  onNotesChange,
}: {
  lessons: Lesson[];
  initialLessonId?: string;
  onNotesChange?: (notes: LessonNote[]) => void;
}) {
  const firstLessonId = lessons[0]?.id ?? "";
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId ?? firstLessonId);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<LessonNote[]>([]);

  useEffect(() => {
    const loaded = loadLessonNotes();
    setNotes(loaded);
    onNotesChange?.(loaded);
  }, [onNotesChange]);

  useEffect(() => {
    setSelectedLessonId(initialLessonId ?? firstLessonId);
  }, [firstLessonId, initialLessonId]);

  useEffect(() => {
    setDraft(getLessonNote(selectedLessonId)?.body ?? "");
  }, [selectedLessonId]);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  );

  function refreshNotes() {
    const loaded = loadLessonNotes();
    setNotes(loaded);
    onNotesChange?.(loaded);
  }

  function onSave() {
    saveLessonNote(selectedLessonId, draft);
    refreshNotes();
  }

  function onDelete() {
    deleteLessonNote(selectedLessonId);
    setDraft("");
    refreshNotes();
  }

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">Practice Notes</p>
          <h2 className="text-lg font-semibold text-ink">我的笔记</h2>
        </div>
        <select
          className="input w-full sm:w-80"
          value={selectedLessonId}
          onChange={(event) => setSelectedLessonId(event.target.value)}
        >
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              第 {String(lesson.order).padStart(2, "0")} 课 · {lesson.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink">
          {selectedLesson
            ? `第 ${String(selectedLesson.order).padStart(2, "0")} 课 · ${selectedLesson.title}`
            : "课程笔记"}
        </p>
        <textarea
          className="input mt-2 min-h-40 w-full resize-y leading-6"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="把卡住的表达、老师提醒、自己的模块替换句写在这里。"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={onSave}
            disabled={!selectedLessonId}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            保存
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onDelete}
            disabled={!draft.trim()}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            清空
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="text-sm font-semibold text-ink">最近笔记</h3>
        {notes.length ? (
          notes.slice(0, 5).map((note) => {
            const lesson = lessons.find((item) => item.id === note.lessonId);
            return (
              <button
                type="button"
                key={note.lessonId}
                className="w-full rounded-md border border-line bg-mist p-3 text-left hover:bg-white"
                onClick={() => setSelectedLessonId(note.lessonId)}
              >
                <p className="text-sm font-semibold text-ink">
                  {lesson
                    ? `第 ${String(lesson.order).padStart(2, "0")} 课 · ${lesson.title}`
                    : note.lessonId}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{note.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(note.updatedAt).toLocaleString()}
                </p>
              </button>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">暂无笔记。</p>
        )}
      </div>
    </section>
  );
}

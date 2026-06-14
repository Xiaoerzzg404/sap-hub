"use client";

const KEY = "sap-jp-lesson-notes-v1";

export type LessonNote = {
  lessonId: string;
  body: string;
  updatedAt: string;
};

type LessonNoteMap = Record<string, LessonNote>;

function readNoteMap(): LessonNoteMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as LessonNoteMap;
  } catch {
    return {};
  }
}

function writeNoteMap(notes: LessonNoteMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(notes));
}

export function loadLessonNotes() {
  return Object.values(readNoteMap()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLessonNote(lessonId: string) {
  return readNoteMap()[lessonId] ?? null;
}

export function saveLessonNote(lessonId: string, body: string) {
  const trimmed = body.trim();
  const notes = readNoteMap();
  if (!trimmed) {
    delete notes[lessonId];
    writeNoteMap(notes);
    return null;
  }

  const note: LessonNote = {
    lessonId,
    body: trimmed,
    updatedAt: new Date().toISOString(),
  };
  writeNoteMap({ ...notes, [lessonId]: note });
  return note;
}

export function deleteLessonNote(lessonId: string) {
  const notes = readNoteMap();
  delete notes[lessonId];
  writeNoteMap(notes);
}

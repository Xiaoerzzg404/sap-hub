"use client";

import type { RecordingAttempt } from "@/types/audio";

const DB_NAME = "sap-jp-speaking-recordings";
const DB_VERSION = 1;
const STORE = "recordings";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("当前浏览器不支持 IndexedDB。"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("打开录音数据库失败。"));
  });
}

export async function saveRecording(recording: RecordingAttempt) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(recording);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("保存录音失败。"));
  });
  db.close();
}

export async function listRecordings(): Promise<RecordingAttempt[]> {
  const db = await openDb();
  const result = await new Promise<RecordingAttempt[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as RecordingAttempt[]);
    request.onerror = () => reject(request.error ?? new Error("读取录音失败。"));
  });
  db.close();
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteRecording(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("删除录音失败。"));
  });
  db.close();
}

export function recordingToObjectUrl(recording: RecordingAttempt) {
  if (recording.blob) return URL.createObjectURL(recording.blob);
  return recording.audioUrl ?? "";
}

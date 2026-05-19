"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "sap-jp-assignment-text-";

function loadText(assignmentId: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + assignmentId) ?? "";
  } catch {
    return "";
  }
}

function saveText(assignmentId: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + assignmentId, value);
}

export function AssignmentTextInput({
  assignmentId,
  prompt
}: {
  assignmentId: string;
  prompt: string;
}) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setText(loadText(assignmentId));
    setSaved(true);
  }, [assignmentId]);

  function update(value: string) {
    setText(value);
    saveText(assignmentId, value);
    setSaved(true);
  }

  function onSave() {
    saveText(assignmentId, text);
    setSaved(true);
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        className="input min-h-24 w-full"
        placeholder={prompt}
        value={text}
        onChange={(event) => update(event.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {saved ? "已本地保存（待后端提交）" : "未保存"}
        </span>
        <button type="button" className="btn-secondary" onClick={onSave}>
          保存到本地
        </button>
      </div>
    </div>
  );
}

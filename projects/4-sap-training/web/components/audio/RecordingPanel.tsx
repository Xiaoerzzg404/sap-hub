"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Save, Square, Trash2 } from "lucide-react";
import type { RecordingAttempt, RecordingPracticeType, SelfAssessment } from "@/types/audio";
import { saveRecording } from "@/lib/audio-storage";
import { markProgress } from "@/lib/progress-storage";
import { WaveformVisualizer } from "./WaveformVisualizer";

const fallbackAssessment: SelfAssessment = {
  pronunciation: 3,
  fluency: 3,
  naturalness: 3,
  sapAccuracy: 3,
  consultantLike: 3
};

const MAX_RECORDING_BYTES = 10 * 1024 * 1024;

export function RecordingPanel({
  lessonId,
  practiceType,
  promptText,
  targetJapanese,
  markAsAssignment = false,
  autoSaveOnStop = false,
  maxDurationSec,
  onSaved,
  onRecordingComplete
}: {
  lessonId: string;
  practiceType: RecordingPracticeType;
  promptText: string;
  targetJapanese?: string;
  markAsAssignment?: boolean;
  autoSaveOnStop?: boolean;
  maxDurationSec?: number;
  onSaved?: (recording: RecordingAttempt) => void;
  onRecordingComplete?: () => void;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [permissionReady, setPermissionReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      void closeAudioContext();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (status !== "recording" || !maxDurationSec) return;
    if (durationSec >= maxDurationSec) stopRecording();
  }, [durationSec, maxDurationSec, status]);

  async function requestPermission() {
    setError("");
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("当前浏览器不支持录音，请使用支持 MediaRecorder 的现代浏览器。");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionReady(true);
      return stream;
    } catch {
      setError("没有麦克风权限，请在浏览器地址栏允许麦克风访问。");
      return null;
    }
  }

  async function startRecording() {
    const stream = await requestPermission();
    if (!stream) return;
    chunksRef.current = [];
    setDurationSec(0);
    setAudioUrl("");
    setBlob(null);
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      }
    } catch (err) {
      console.warn("AnalyserNode setup failed:", err);
    }
    try {
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await closeAudioContext();
        const nextBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const nextUrl = URL.createObjectURL(nextBlob);
        setBlob(nextBlob);
        setAudioUrl(nextUrl);
        setStatus("stopped");
        if (timerRef.current) window.clearInterval(timerRef.current);
        onRecordingComplete?.();
        if (autoSaveOnStop) await saveCurrentRecording(nextBlob);
      };
      recorder.start();
      setStatus("recording");
      timerRef.current = window.setInterval(() => setDurationSec((value) => value + 1), 1000);
    } catch {
      setError("录音失败，请检查麦克风设备后重试。");
    }
  }

  function pauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.pause();
      setStatus("paused");
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  }

  function resumeRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "paused") {
      recorder.resume();
      setStatus("recording");
      timerRef.current = window.setInterval(() => setDurationSec((value) => value + 1), 1000);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  async function closeAudioContext() {
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // Recorder cleanup should never fail because analyser cleanup failed.
      }
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  }

  async function saveLocalOnly(activeBlob: Blob, recordingId = `local-${lessonId}-${practiceType}-${Date.now()}`) {
    const recording: RecordingAttempt = {
      id: recordingId,
      userId: "current-student",
      lessonId,
      practiceType,
      promptText,
      targetJapanese,
      audioUrl: "",
      blob: activeBlob,
      durationSec,
      createdAt: new Date().toISOString(),
      selfAssessment: fallbackAssessment
    };
    await saveRecording(recording);
    await markProgress("completedRecordings", recording.id);
    if (markAsAssignment) await markProgress("completedAssignments", `${lessonId}-${practiceType}`);
    onSaved?.(recording);
  }

  async function saveCurrentRecording(blobOverride?: Blob) {
    const activeBlob = blobOverride ?? blob;
    if (!activeBlob) {
      setError("还没有可保存的录音。");
      return;
    }
    if (activeBlob.size > MAX_RECORDING_BYTES) {
      setError("录音超过 10 MB，请缩短后重新录制。");
      return;
    }

    const mimeType = activeBlob.type || "audio/webm";
    try {
      const signResponse = await fetch("/api/recordings/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          practiceType,
          promptText,
          targetJapanese,
          mimeType,
          durationSec,
          sizeBytes: activeBlob.size,
          selfAssessment: fallbackAssessment
        })
      });

      if (!signResponse.ok) {
        setError("准备上传失败，录音已保存在本地。");
        await saveLocalOnly(activeBlob);
        return;
      }

      const { recordingId, storageKey, uploadUrl } = await signResponse.json();
      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: activeBlob
      });

      if (!putResponse.ok) {
        setError("上传到云端失败，录音已保存在本地。");
        await saveLocalOnly(activeBlob, recordingId);
        return;
      }

      const patchResponse = await fetch(`/api/recordings/${recordingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey, status: "ready" })
      });

      if (!patchResponse.ok) {
        setError("云端上传完成，但服务器写回失败，录音已保存在本地。");
        await saveLocalOnly(activeBlob, recordingId);
        return;
      }

      setError("");
      await saveLocalOnly(activeBlob, recordingId);
    } catch {
      setError("录音上传失败，录音已保存在本地。");
      await saveLocalOnly(activeBlob);
    }
  }

  function deleteDraft() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setBlob(null);
    setDurationSec(0);
    setStatus("idle");
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-white p-4">
      <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
        注意：你的录音会上传到服务器供讲师反馈。查看{" "}
        <a href="/privacy" className="underline">
          隐私政策
        </a>
        。
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">学生录音</p>
          <p className="mt-1 text-xs text-slate-500">{promptText}</p>
          {targetJapanese ? <p className="mt-1 text-sm text-sap">{targetJapanese}</p> : null}
        </div>
        <span className="rounded-md bg-mist px-2 py-1 text-sm font-semibold text-ink">
          {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, "0")}
        </span>
      </div>
      <WaveformVisualizer active={status === "recording"} analyser={analyserRef.current} />
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={startRecording} disabled={status === "recording"}>
          <Mic className="h-4 w-4" />
          {permissionReady ? "开始录音" : "请求麦克风并录音"}
        </button>
        {status === "recording" ? (
          <button type="button" className="btn-secondary" onClick={pauseRecording}>
            <Pause className="h-4 w-4" />
            暂停录音
          </button>
        ) : null}
        {status === "paused" ? (
          <button type="button" className="btn-secondary" onClick={resumeRecording}>
            <Play className="h-4 w-4" />
            继续录音
          </button>
        ) : null}
        <button type="button" className="btn-secondary" onClick={stopRecording} disabled={status === "idle" || status === "stopped"}>
          <Square className="h-4 w-4" />
          停止录音
        </button>
        <button type="button" className="btn-secondary" onClick={deleteDraft} disabled={!audioUrl}>
          <Trash2 className="h-4 w-4" />
          重新录音/删除
        </button>
        <button type="button" className="btn-primary" onClick={() => saveCurrentRecording()} disabled={!blob}>
          <Save className="h-4 w-4" />
          {markAsAssignment ? "保存为作业" : "保存录音"}
        </button>
      </div>
      {audioUrl ? <audio className="w-full" controls src={audioUrl} /> : null}
    </div>
  );
}

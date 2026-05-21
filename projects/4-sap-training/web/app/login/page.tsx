"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    await signIn("email", { email, callbackUrl: "/dashboard" });
    setSubmitting(false);
  }

  return (
    <div className="page-shell">
      <div className="panel mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold text-ink">登录</h1>
        <p className="mt-2 text-sm text-slate-600">输入你的邮箱，我们会发送一个登录链接（15 分钟内有效）。</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input w-full"
          />
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1"
            />
            <span>
              我已阅读并同意{" "}
              <a href="/privacy" target="_blank" className="text-sap underline">
                隐私政策
              </a>
              。
            </span>
          </label>
          <button type="submit" className="btn-primary w-full" disabled={!agreed || submitting}>
            {submitting ? "发送中..." : "发送登录链接"}
          </button>
        </form>
      </div>
    </div>
  );
}

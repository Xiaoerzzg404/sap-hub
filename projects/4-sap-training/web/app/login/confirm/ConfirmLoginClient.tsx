"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ConfirmLoginClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <div className="page-shell">
        <div className="panel mx-auto max-w-md p-6 text-center">
          <h1 className="text-xl font-bold text-red-700">登录链接无效</h1>
          <p className="mt-2 text-sm text-slate-600">请回到登录页重新申请新的登录链接。</p>
          <a href="/login" className="btn-primary mt-4">
            返回登录
          </a>
        </div>
      </div>
    );
  }

  const confirmedToken = token;
  const confirmedEmail = email;

  function onConfirm() {
    setLoading(true);
    const callback = new URLSearchParams({
      token: confirmedToken,
      email: confirmedEmail,
      callbackUrl
    });
    window.location.href = `/api/auth/callback/email?${callback.toString()}`;
  }

  return (
    <div className="page-shell">
      <div className="panel mx-auto max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold text-ink">确认登录</h1>
        <p className="mt-3 text-sm text-slate-600">
          你正以 <span className="font-semibold">{email}</span> 身份登录 SAP 日语口语训练平台。
        </p>
        <p className="mt-2 text-xs text-slate-500">
          这一步用于防止邮箱安全扫描提前消耗你的 magic link。
        </p>
        <button onClick={onConfirm} disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? "登录中..." : "点击确认登录"}
        </button>
      </div>
    </div>
  );
}

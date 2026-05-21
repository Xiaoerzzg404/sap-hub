"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mic2,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Mode = "login" | "register";

type LoginClientProps = {
  callbackUrl: string;
  initialMode: Mode;
};

export function LoginClient({ callbackUrl, initialMode }: LoginClientProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordHint = useMemo(() => {
    if (registerPassword.length === 0) return "至少 8 位，包含字母和数字。";
    if (registerPassword.length < 8) return "还需要更长一点。";
    if (!/[A-Za-z]/.test(registerPassword) || !/[0-9]/.test(registerPassword)) {
      return "需要同时包含字母和数字。";
    }
    return "密码格式可以。";
  }, [registerPassword]);

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const result = await signIn("credentials", {
      identifier,
      password: loginPassword,
      callbackUrl,
      redirect: false,
    });

    setSubmitting(false);
    if (result?.ok) {
      window.location.href = result.url ?? callbackUrl;
      return;
    }
    setError("邮箱/用户名或密码不正确。没有注册的话，请先注册。");
  }

  async function submitRegister(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!agreed) {
      setError("注册前请先确认隐私与录音数据说明。");
      return;
    }
    if (registerPassword !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username,
        name,
        inviteCode,
        password: registerPassword,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setSubmitting(false);
      setError(data.message ?? "注册失败，请稍后再试。");
      return;
    }

    const result = await signIn("credentials", {
      identifier: username || email,
      password: registerPassword,
      callbackUrl: "/post-login",
      redirect: false,
    });
    setSubmitting(false);

    if (result?.ok) {
      window.location.href = result.url ?? "/post-login";
      return;
    }

    setMode("login");
    setIdentifier(username || email);
    setMessage("注册成功。请用刚刚设置的密码登录。");
  }

  return (
    <main className="min-h-screen bg-[#eef5f8]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="flex flex-col justify-between rounded-lg border border-line bg-white p-6 shadow-soft">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sap text-white">
                <Mic2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sap">SAP 日本项目实战日语</p>
                <h1 className="text-xl font-bold text-ink">口语训练工作台</h1>
              </div>
            </div>
            <div className="mt-10">
              <p className="text-sm font-semibold text-sap">Private Training Workspace</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-ink">
                登录后进入你的课程、录音、笔记和讲师反馈。
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                未登录状态下不开放课程内容。没有账号请先注册，注册后默认获得学生权限。
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 lg:grid-cols-1">
            <AuthFact icon={LockKeyhole} title="账号密码登录" text="邮箱或用户名都可以登录。" />
            <AuthFact icon={ShieldCheck} title="角色隔离" text="学生、讲师、管理员权限分开。" />
            <AuthFact icon={CheckCircle2} title="登录后分流" text="按角色进入可访问的工作区。" />
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <div className="grid grid-cols-2 rounded-md border border-line bg-mist p-1">
              <button
                type="button"
                className={
                  mode === "login"
                    ? "rounded bg-white px-3 py-2 text-sm font-semibold text-sap shadow-sm"
                    : "rounded px-3 py-2 text-sm font-semibold text-slate-600"
                }
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
              >
                登录
              </button>
              <button
                type="button"
                className={
                  mode === "register"
                    ? "rounded bg-white px-3 py-2 text-sm font-semibold text-sap shadow-sm"
                    : "rounded px-3 py-2 text-sm font-semibold text-slate-600"
                }
                onClick={() => {
                  setMode("register");
                  setError("");
                  setMessage("");
                }}
              >
                注册
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-bold text-ink">
                {mode === "login" ? "登录训练平台" : "注册训练账号"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {mode === "login"
                  ? "请输入邮箱或用户名，以及你注册时设置的密码。"
                  : "注册后即可进入学生学习区；讲师和管理员权限由管理员授予。"}
              </p>
            </div>

            {error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {message}
              </p>
            ) : null}

            {mode === "login" ? (
              <form onSubmit={submitLogin} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-ink">邮箱或用户名</span>
                  <input
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="input mt-2 w-full"
                    placeholder="your@email.com 或 username"
                  />
                </label>
                <PasswordField
                  label="密码"
                  value={loginPassword}
                  show={showPassword}
                  autoComplete="current-password"
                  onChange={setLoginPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting ? "登录中..." : "登录"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <p className="text-center text-sm text-slate-600">
                  还没有账号？{" "}
                  <button
                    type="button"
                    className="font-semibold text-sap"
                    onClick={() => setMode("register")}
                  >
                    先注册
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={submitRegister} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-ink">邮箱</span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="input mt-2 w-full"
                      placeholder="your@email.com"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-ink">用户名</span>
                    <input
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="input mt-2 w-full"
                      placeholder="sap-consultant"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-ink">显示名称</span>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="input mt-2 w-full"
                    placeholder="可选"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-ink">邀请码</span>
                  <input
                    autoComplete="off"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    className="input mt-2 w-full"
                    placeholder="内测账号如有邀请码，请填在这里"
                  />
                </label>
                <PasswordField
                  label="密码"
                  value={registerPassword}
                  show={showPassword}
                  autoComplete="new-password"
                  onChange={setRegisterPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
                <p className="text-xs text-slate-500">{passwordHint}</p>
                <PasswordField
                  label="确认密码"
                  value={confirmPassword}
                  show={showPassword}
                  autoComplete="new-password"
                  onChange={setConfirmPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    我理解平台会保存登录邮箱、学习进度、录音、自评和讲师反馈；录音不会公开展示。
                  </span>
                </label>
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting ? "注册中..." : "注册并进入"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthFact({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-mist p-3">
      <Icon className="h-5 w-5 text-sap" aria-hidden="true" />
      <p className="mt-2 font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  show,
  autoComplete,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  show: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="mt-2 flex rounded-md border border-line bg-white focus-within:ring-2 focus-within:ring-sap focus-within:ring-offset-2">
        <input
          required
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-l-md border-0 px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="px-3 text-slate-500"
          aria-label={show ? "隐藏密码" : "显示密码"}
        >
          {show ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </span>
    </label>
  );
}

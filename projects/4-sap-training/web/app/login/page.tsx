import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/options";
import { defaultPathForSession } from "@/lib/auth/roles";
import { LoginClient } from "./LoginClient";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    mode?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user?.id) redirect(defaultPathForSession(session));

  const params = searchParams ? await searchParams : {};
  return (
    <LoginClient
      callbackUrl={safeCallbackUrl(params.callbackUrl)}
      initialMode={params.mode === "register" ? "register" : "login"}
    />
  );
}

function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/post-login";
  if (value.startsWith("/login")) return "/post-login";
  return value;
}

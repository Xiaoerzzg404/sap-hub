import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/options";
import { defaultPathForSession } from "@/lib/auth/roles";

export default async function PostLoginPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  redirect(defaultPathForSession(session));
}

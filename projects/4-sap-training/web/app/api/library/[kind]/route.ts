import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { canAccessAnyRole } from "@/lib/auth/roles";
import { getLibraryItemByKind } from "@/lib/content/lessons";

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccessAnyRole(session, ["student", "teacher"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { kind } = await params;
  const item = await getLibraryItemByKind(kind);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (item.visibility === "teacher" && !canAccessAnyRole(session, ["teacher"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ item });
}

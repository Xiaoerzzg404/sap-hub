import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { canAccessAnyRole } from "@/lib/auth/roles";
import { getLessonAssetByKind } from "@/lib/content/lessons";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string; kind: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccessAnyRole(session, ["student", "teacher"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { lessonId, kind } = await params;
  const asset = await getLessonAssetByKind(lessonId, kind);
  if (!asset) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (asset.visibility === "teacher" && !canAccessAnyRole(session, ["teacher"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ asset });
}

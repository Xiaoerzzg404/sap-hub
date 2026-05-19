import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { getLessonAssetByKind } from "@/lib/content/lessons";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string; kind: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { lessonId, kind } = await params;
  const asset = await getLessonAssetByKind(lessonId, kind);
  if (!asset) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ asset });
}

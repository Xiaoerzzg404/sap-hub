import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { getLibraryItemByKind } from "@/lib/content/lessons";

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { kind } = await params;
  const item = await getLibraryItemByKind(kind);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ item });
}

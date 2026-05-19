import Link from "next/link";
import { Mic2, PlayCircle } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sap text-white">
            <Mic2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sap">SAP 日本项目实战日语</p>
            <h1 className="text-base font-bold text-ink">口语训练平台</h1>
          </div>
        </Link>
        <Link href="/speaking/shadowing" className="btn-primary">
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          开始跟读
        </Link>
      </div>
    </header>
  );
}

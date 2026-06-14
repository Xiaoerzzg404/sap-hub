import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteProductAsset } from "@/app/actions";
import { Badge } from "@/components/badge";
import { labelOf, productStages, productTypes } from "@/lib/dictionaries";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const products = await prisma.productAsset.findMany({ orderBy: [{ stage: "asc" }, { createdAt: "desc" }] });

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">产品资产</h2>
          <p className="mt-1 text-sm text-slate-600">从模板库、小课、训练营，到企业内训、诊断咨询、PoC 和长期顾问服务。</p>
        </div>
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white" href="/products/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          新增产品
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" key={product.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{product.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="teal">{labelOf(productTypes, product.productType)}</Badge>
                  <Badge tone={product.stage === "LIVE" ? "green" : product.stage === "BETA" ? "amber" : "slate"}>{labelOf(productStages, product.stage)}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" href={`/products/${product.id}/edit`}>编辑</Link>
                <form action={deleteProductAsset.bind(null, product.id)}>
                  <button className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">删除</button>
                </form>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-slate-500">目标客户</dt><dd className="font-medium text-slate-900">{product.targetCustomer}</dd></div>
              <div><dt className="text-slate-500">价格区间</dt><dd className="font-medium text-slate-900">{product.priceRange ?? "-"}</dd></div>
              <div><dt className="text-slate-500">交付形式</dt><dd className="font-medium text-slate-900">{product.deliveryFormat}</dd></div>
              <div><dt className="text-slate-500">关联内容</dt><dd className="font-medium text-slate-900">{product.relatedContent ?? "-"}</dd></div>
            </dl>
            <div className="mt-4 rounded-md bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">交付物</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{product.deliverables}</p>
            </div>
            <div className="mt-3 rounded-md bg-blue-50 p-3">
              <div className="text-xs font-semibold text-blue-700">销售话术</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{product.salesMessage}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

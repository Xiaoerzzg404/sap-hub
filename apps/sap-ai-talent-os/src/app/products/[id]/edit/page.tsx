import { notFound } from "next/navigation";
import { updateProductAsset } from "@/app/actions";
import { ProductForm } from "@/components/domain-forms";
import { prisma } from "@/lib/prisma";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.productAsset.findUnique({ where: { id } });
  if (!product) notFound();
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">编辑产品资产</h2>
        <p className="mt-1 text-sm text-slate-600">保持清晰的目标客户、交付物和销售话术。</p>
      </div>
      <ProductForm action={updateProductAsset.bind(null, product.id)} product={product} />
    </>
  );
}

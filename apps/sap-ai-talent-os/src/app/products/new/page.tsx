import { createProductAsset } from "@/app/actions";
import { ProductForm } from "@/components/domain-forms";

export default function NewProductPage() {
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">新增产品资产</h2>
        <p className="mt-1 text-sm text-slate-600">优先把重复交付沉淀成模板、课程、工作坊和诊断咨询。</p>
      </div>
      <ProductForm action={createProductAsset} />
    </>
  );
}

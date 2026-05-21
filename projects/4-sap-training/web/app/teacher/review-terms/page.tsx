import { ReviewTermsTable } from "@/components/teacher/ReviewTermsTable";
import { requireRoles } from "@/lib/auth/guards";
import { getReviewTerms } from "@/lib/content/lessons";

export default async function ReviewTermsPage() {
  await requireRoles(["teacher"], "/teacher/review-terms");

  const allReviewTerms = await getReviewTerms();

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Review Terms</p>
        <h1 className="text-2xl font-bold text-ink">术语与 ASR 待复核</h1>
      </div>
      <ReviewTermsTable items={allReviewTerms} />
    </div>
  );
}

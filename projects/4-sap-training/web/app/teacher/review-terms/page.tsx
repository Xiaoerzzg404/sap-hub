import { redirect } from "next/navigation";
import { ReviewTermsTable } from "@/components/teacher/ReviewTermsTable";
import { auth } from "@/lib/auth/options";
import { getReviewTerms } from "@/lib/content/lessons";

export default async function ReviewTermsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/teacher/review-terms");
  if (session.user.role !== "teacher" && session.user.role !== "admin") redirect("/");

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

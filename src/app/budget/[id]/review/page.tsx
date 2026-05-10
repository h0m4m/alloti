import { notFound } from "next/navigation";
import {
  getBudgetReview,
  getBudgetPeriods,
  getSavingsGoals,
  getRolloverAmount,
} from "@/lib/actions";
import { BudgetReviewView } from "@/components/budget-review-view";

export default async function BudgetReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [review, allPeriods, goals, rolloverInfo] = await Promise.all([
    getBudgetReview(id),
    getBudgetPeriods(),
    getSavingsGoals(),
    getRolloverAmount(id),
  ]);

  if (!review) notFound();

  return (
    <BudgetReviewView
      review={review}
      allPeriods={allPeriods}
      goals={goals}
      rolloverInfo={rolloverInfo}
    />
  );
}

import { notFound } from "next/navigation";
import { getSavingsGoalWithContributions } from "@/lib/actions";
import { GoalDetailView } from "@/components/goal-detail-view";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSavingsGoalWithContributions(id);

  if (!data) notFound();

  return <GoalDetailView goal={data.goal} contributions={data.contributions} />;
}

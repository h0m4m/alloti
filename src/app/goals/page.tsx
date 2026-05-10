import { getSavingsGoals } from "@/lib/actions";
import { GoalsListView } from "@/components/goals-list-view";

export default async function GoalsPage() {
  const goals = await getSavingsGoals();
  return <GoalsListView goals={goals} />;
}

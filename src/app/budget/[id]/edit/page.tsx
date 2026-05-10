import { notFound } from "next/navigation";
import { getBudgetPeriod } from "@/lib/actions";
import { EditBudgetForm } from "@/components/edit-budget-form";

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const period = await getBudgetPeriod(id);

  if (!period) notFound();

  return <EditBudgetForm period={period} />;
}

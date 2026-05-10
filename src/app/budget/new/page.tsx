import {
  getCategorySuggestions,
  getBudgetPeriods,
  getBudgetTemplates,
} from "@/lib/actions";
import { CreateBudgetForm } from "@/components/create-budget-form";

export default async function NewBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; source?: string }>;
}) {
  const params = await searchParams;
  const [suggestions, periods, templates] = await Promise.all([
    getCategorySuggestions(),
    getBudgetPeriods(),
    getBudgetTemplates(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8">
      <CreateBudgetForm
        suggestions={suggestions}
        previousBudgets={periods}
        templates={templates}
        initialMode={
          params.mode as "blank" | "duplicate" | "template" | undefined
        }
        initialSourceId={params.source}
      />
    </div>
  );
}

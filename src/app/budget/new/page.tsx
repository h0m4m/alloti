import { getCategorySuggestions } from "@/lib/actions";
import { CreateBudgetForm } from "@/components/create-budget-form";

export default async function NewBudgetPage() {
  const suggestions = await getCategorySuggestions();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
      <CreateBudgetForm suggestions={suggestions} />
    </div>
  );
}

import { getCategoryRules, getCategorySuggestions } from "@/lib/actions";
import { CategoryRulesView } from "@/components/category-rules-view";

export default async function CategoryRulesPage() {
  const [rules, categories] = await Promise.all([
    getCategoryRules(),
    getCategorySuggestions(),
  ]);

  const categoryNames = categories.map(
    (c: { name: string }) => c.name
  );

  return <CategoryRulesView rules={rules} categoryNames={categoryNames} />;
}

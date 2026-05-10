import { auth } from "@/auth";
import { getUserPreferences, getBudgetTemplates } from "@/lib/actions";
import { SettingsView } from "@/components/settings-view";

export default async function SettingsPage() {
  const session = await auth();
  const [preferences, templates] = await Promise.all([
    getUserPreferences(),
    getBudgetTemplates(),
  ]);

  return (
    <SettingsView
      user={{
        name: session?.user?.name || null,
        email: session?.user?.email || null,
        image: session?.user?.image || null,
      }}
      preferences={preferences}
      templates={templates}
    />
  );
}

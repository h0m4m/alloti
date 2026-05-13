import { getImportToken } from "@/lib/actions";
import { ImportSettingsView } from "@/components/import-settings-view";

export default async function ImportSettingsPage() {
  const importToken = await getImportToken();

  return <ImportSettingsView importToken={importToken} />;
}

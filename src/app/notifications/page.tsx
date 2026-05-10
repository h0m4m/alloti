import { generateNotifications } from "@/lib/actions";
import { NotificationsPageView } from "@/components/notifications-page-view";

export default async function NotificationsPage() {
  const notifications = await generateNotifications();
  return <NotificationsPageView notifications={notifications} />;
}

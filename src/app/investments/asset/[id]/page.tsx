import { getAssetDetail } from "@/lib/investment-actions";
import { AssetDetailView } from "@/components/asset-detail-view";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAssetDetail(id);
  return <AssetDetailView detail={detail} />;
}

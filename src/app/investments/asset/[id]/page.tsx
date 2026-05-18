import { getAssetDetail, getSymbolHistory, getSymbolNews } from "@/lib/investment-actions";
import { AssetDetailView } from "@/components/asset-detail-view";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAssetDetail(id);
  const [priceChart, news] = await Promise.all([
    getSymbolHistory(detail.asset.symbol),
    getSymbolNews(detail.asset.symbol),
  ]);
  return <AssetDetailView detail={detail} priceChart={priceChart} news={news} />;
}

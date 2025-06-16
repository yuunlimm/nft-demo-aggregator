import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CollectionsTable } from "./CollectionsTable";
import { Network } from "@aptos-labs/ts-sdk";
import { useEffect, useState } from "react";
import { fetchAggregatorStats, fetchCollectionsByVolume } from "@/lib/api";
import { DollarSign, Image, Store } from "lucide-react";

const Analytics = ({ network }: { network: Network }) => {
  const [stats, setStats] = useState({
    totalActiveListings: 0,
    totalMarketplaces: 0,
    totalVolume: 0
  });
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aggregatorStats, topCollections] = await Promise.all([
          fetchAggregatorStats(network),
          fetchCollectionsByVolume({ network, limit: 10 })
        ]);

        // Calculate total volume from all collections
        const totalVolume = topCollections.reduce((sum, collection) => {
          const volume = typeof collection.total_volume_apt === 'number' 
            ? collection.total_volume_apt 
            : 0;
          return sum + volume;
        }, 0);

        setStats({
          totalActiveListings: aggregatorStats.total_active_listings,
          totalMarketplaces: aggregatorStats.total_marketplaces,
          totalVolume
        });
        setCollections(topCollections);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [network]);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Analytics</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} APT</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NFTs Listed</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActiveListings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketplaces</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMarketplaces}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Top Collections</h2>
        <CollectionsTable network={network} initialCollections={collections} loading={loading} />
      </div>
    </div>
  );
};

export default Analytics;

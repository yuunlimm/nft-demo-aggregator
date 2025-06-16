import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionData } from "@/types/index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { fetchCollectionsByVolume, fetchCollectionsBySales, fetchCollectionsByFloorPrice } from "@/lib/api";
import { Network } from "@aptos-labs/ts-sdk";

interface CollectionsTableProps {
  network?: Network;
  initialCollections?: CollectionData[];
  loading?: boolean;
}

type RankingType = 'volume' | 'sales' | 'floor';

export const CollectionsTable = ({ 
  network = Network.MAINNET,
  initialCollections = [],
  loading: initialLoading = false 
}: CollectionsTableProps) => {
  const [activeTab, setActiveTab] = useState<RankingType>('volume');
  const [collections, setCollections] = useState<CollectionData[]>(initialCollections);
  const [loading, setLoading] = useState(initialLoading);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        let data: CollectionData[] = [];
        switch (activeTab) {
          case 'volume':
            data = await fetchCollectionsByVolume({ network });
            break;
          case 'sales':
            data = await fetchCollectionsBySales({ network });
            break;
          case 'floor':
            data = await fetchCollectionsByFloorPrice({ network });
            break;
        }
        // Ensure all required fields are present and convert string values to numbers
        const processedData = data.map(collection => ({
          collection_id: collection.collection_id || '',
          collection_name: collection.collection_name || 'Unknown Collection',
          total_volume_apt: typeof collection.total_volume_apt === 'string' 
            ? parseFloat(collection.total_volume_apt) 
            : (collection.total_volume_apt || 0),
          total_sales: collection.total_sales || 0,
          floor_price_apt: typeof collection.floor_price_apt === 'string'
            ? parseFloat(collection.floor_price_apt)
            : (collection.floor_price_apt || 0)
        }));
        setCollections(processedData);
      } catch (error) {
        console.error(`Error fetching collections by ${activeTab}:`, error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [activeTab, network]);

  const renderTable = () => {
    if (loading) {
      return (
        <div className="rounded-md border p-4 text-center">
          Loading collections...
        </div>
      );
    }

    if (!collections.length) {
      return (
        <div className="rounded-md border p-4 text-center">
          No collections found
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collection</TableHead>
            {activeTab === 'volume' && (
              <TableHead>
                <div className="flex items-center gap-2">
                  Volume 
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowDownAZ className="h-4 w-4" />
                  </Button>
                </div>
              </TableHead>
            )}
            {activeTab === 'sales' && (
              <>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Sales
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowDownAZ className="h-4 w-4" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Volume
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowDownAZ className="h-4 w-4" />
                    </Button>
                  </div>
                </TableHead>
              </>
            )}
            {activeTab === 'floor' && (
              <TableHead>
                <div className="flex items-center gap-2">
                  Floor Price
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowDownAZ className="h-4 w-4" />
                  </Button>
                </div>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => (
            <TableRow key={collection.collection_id}>
              <TableCell className="font-medium">{collection.collection_name}</TableCell>
              {activeTab === 'volume' && (
                <TableCell>{collection.total_volume_apt} APT</TableCell>
              )}
              {activeTab === 'sales' && (
                <>
                  <TableCell>{collection.total_sales}</TableCell>
                  <TableCell>{collection.total_volume_apt} APT</TableCell>
                </>
              )}
              {activeTab === 'floor' && (
                <TableCell>{collection.floor_price_apt} APT</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="volume" onValueChange={(value) => setActiveTab(value as RankingType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volume">By Volume</TabsTrigger>
          <TabsTrigger value="sales">By Sales</TabsTrigger>
          <TabsTrigger value="floor">By Floor Price</TabsTrigger>
        </TabsList>
        <TabsContent value="volume" className="mt-4">
          {renderTable()}
        </TabsContent>
        <TabsContent value="sales" className="mt-4">
          {renderTable()}
        </TabsContent>
        <TabsContent value="floor" className="mt-4">
          {renderTable()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

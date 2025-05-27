
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CollectionsTable } from "./CollectionsTable";

const Analytics = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Analytics</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Volume</CardTitle>
            <CardDescription>All time trading volume</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,234 ETH</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NFTs Listed</CardTitle>
            <CardDescription>Total active listings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">156</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Traders</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">892</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Top Collections</h2>
        <CollectionsTable />
      </div>
    </div>
  );
};

export default Analytics;

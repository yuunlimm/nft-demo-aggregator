
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

// Mock data (replace with API data later)
const mockCollections = [
  {
    id: "1",
    name: "Bored Apes",
    volume: "12,450 APT",
    sales: 234,
    floorPrice: "80 APT",
  },
  {
    id: "2",
    name: "CryptoPunks",
    volume: "8,230 APT",
    sales: 156,
    floorPrice: "65 APT",
  },
  {
    id: "3",
    name: "Doodles",
    volume: "3,120 APT",
    sales: 89,
    floorPrice: "12 APT",
  },
];

export const CollectionsTable = () => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collection</TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                Volume 
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowDownAZ className="h-4 w-4" />
                </Button>
              </div>
            </TableHead>
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
                Floor Price
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowDownAZ className="h-4 w-4" />
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockCollections.map((collection) => (
            <TableRow key={collection.id}>
              <TableCell className="font-medium">{collection.name}</TableCell>
              <TableCell>{collection.volume}</TableCell>
              <TableCell>{collection.sales}</TableCell>
              <TableCell>{collection.floorPrice}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

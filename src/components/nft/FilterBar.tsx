
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpAZ, Filter } from "lucide-react";

interface FilterBarProps {
  onMarketplaceChange: (value: string) => void;
  onCollectionChange: (value: string) => void;
  onSortChange: (value: string) => void;
  marketplaces: string[];
  collections?: string[]; // optional for now
}

const sortOptions = [
  { value: "latest", label: "Latest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

export const FilterBar = ({
  onMarketplaceChange,
  onCollectionChange,
  onSortChange,
  marketplaces,
  collections,
}: FilterBarProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <Select onValueChange={onMarketplaceChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Marketplace" />
          </SelectTrigger>
          <SelectContent>
            {marketplaces.map((marketplace) => (
              <SelectItem key={marketplace} value={marketplace.toLowerCase()}>
                {marketplace}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* <Select onValueChange={onCollectionChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Collection" />
        </SelectTrigger>
        <SelectContent>
          {collections.map((collection) => (
            <SelectItem key={collection} value={collection.toLowerCase()}>
              {collection}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}

      <Select onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                {option.value.includes('latest') ? <ArrowDownAZ className="h-4 w-4" /> : 
                 option.value.includes('oldest') ? <ArrowUpAZ className="h-4 w-4" /> : null}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

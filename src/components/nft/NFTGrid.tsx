import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { FilterBar } from "./FilterBar";
import { fetchActiveListings, fetchMarketplaceConfigs } from "../../lib/api";

const NFTGrid = () => {
  const [marketplace, setMarketplace] = useState("all");
  const [collection, setCollection] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp_desc");
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketplaces, setMarketplaces] = useState<string[]>([]);

  useEffect(() => {
    async function loadMarketplaces() {
      const configs = await fetchMarketplaceConfigs();
      const names = configs.map((m) => m.name); // e.g. "Topaz", "Tradeport"
      setMarketplaces(["All", ...names]); // prepend "All"
    }
  
    loadMarketplaces();
  }, []);
  
  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const { nfts: fetchedNFTs } = await fetchActiveListings({
          marketplace: marketplace !== "all" ? marketplace : undefined,
          collection: collection !== "all" ? collection : undefined,
          sortOrder: sortBy,
          page: 1,
          pageSize: 20,
        });
        setNfts(fetchedNFTs);
      } catch (error) {
        console.error("Failed to fetch active listings:", error);
        setNfts([]);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [marketplace, collection, sortBy]);

  return (
    <div>
      <FilterBar
        onMarketplaceChange={setMarketplace}
        onCollectionChange={setCollection}
        onSortChange={setSortBy}
        marketplaces={marketplaces}
      />

      {loading ? (
        <div className="text-center p-6">Loading NFTs...</div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      ) : (
        <div className="text-center p-6 text-muted">No listings found.</div>
      )}
    </div>
  );
};

export default NFTGrid;

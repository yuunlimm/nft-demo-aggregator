
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NFTGrid from "@/components/nft/NFTGrid";
import ListNFTForm from "@/components/nft/ListNFTForm";
import Analytics from "@/components/analytics/Analytics";
import Header from "@/components/layout/Header";

import { Network } from "@aptos-labs/ts-sdk";

const Index = ({ network }: { network: Network }) => {
  const [activeTab, setActiveTab] = useState("explore");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="list">List NFT</TabsTrigger>
          </TabsList>
          <TabsContent value="explore" className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Explore NFTs</h1>
            <NFTGrid network={network} />
          </TabsContent>
          <TabsContent value="list">
            <ListNFTForm network={network} />
          </TabsContent>
          <TabsContent value="analytics">
            <Analytics network={network} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

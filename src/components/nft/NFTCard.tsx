import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { aggregatorAddress } from "./ListNFTForm";

interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: {
    amount: number;
    currency: string;
  };
  creator: string;
  listing_id?: string;
  marketplace?: string; // address string like "0xabc..."
}

export const MARKETPLACE_ADDRESS_MAP: Record<Network, Record<string, string>> = {
  [Network.MAINNET]: {
    "bluemove": "0xd1fd99c1944b84d1670a2536417e997864ad12303d19eac725891691b04d614e",
    "tradeport_v1": "0xe11c12ec495f3989c35e1c6a0af414451223305b579291fc8f3d9d0575a23c26",
    "tradeport_v2": "0xe11c12ec495f3989c35e1c6a0af414451223305b579291fc8f3d9d0575a23c26",
    "demo marketplace": "0x27594035ca1c038bbe322e681b7d2a9c53c58bde432626bfcdd85d19dda222a5",
    "wapal": "0x584b50b999c78ade62f8359c91b5165ff390338d45f8e55969a04e65d76258c9",
    "third_party_marketplace": "0xaed4462e5717f62045f32a4c5de793caf235940ef42edfdc1b7b73bc292ee2e6",
  },
  [Network.DEVNET]: {
    "on chain marketplace": "0x48ac47b64f890af66bb25b147f1d0afa439a584930f0f5060919e73f510ba80a",
    "third_party_marketplace": "0x9079b776f1e977eae264e8fccbc6ee7027df7262d129e43b7835f8cdd77b522b",
  },
  [Network.TESTNET]: {
    "bluemove": "",
    "tradeport_v1": "",
    "tradeport_v2": "",
    "demo marketplace": "",
    "wapal": "",
    "third_party_marketplace": "",
  },
  [Network.LOCAL]: {
    "bluemove": "",
    "tradeport_v1": "",
    "tradeport_v2": "",
    "demo marketplace": "",
    "wapal": "",
    "third_party_marketplace": "",
  },
  [Network.CUSTOM]: {
    "bluemove": "",
    "tradeport_v1": "",
    "tradeport_v2": "",
    "demo marketplace": "",
    "wapal": "",
    "third_party_marketplace": "",
  }
};

// export const MARKETPLACE_MODULE_MAP: Record<string, string> = {
//   "bluemove": "0xabc...123",
//   "tradeport_v1": "0xdef...456",
//   "tradeport_v2": "0xdef...456",
//   "souffl3": "0x789...000",
//   "demo marketplace": "0x27594035ca1c038bbe322e681b7d2a9c53c58bde432626bfcdd85d19dda222a5",
//   "wapal": "0x584b50b999c78ade62f8359c91b5165ff390338d45f8e55969a04e65d76258c9",
// };
  

export const NFTCard = ({ nft, network }: { nft: NFT, network: Network }) => {
  const aptos = new Aptos(new AptosConfig({ network }));
  const { account, signAndSubmitTransaction } = useWallet();

  const handleBuyNow = async () => {
    if (!account?.address) {
      toast.error("Wallet not connected");
      return;
    }
    console.log(nft.marketplace);
    const moduleAddress = MARKETPLACE_ADDRESS_MAP[network][nft.marketplace.toLowerCase()];
    if (!moduleAddress) {
      toast.error(`Unknown marketplace: ${nft.marketplace}`);
      console.error(`Unknown marketplace: ${nft.marketplace}`);
      return;
    }

    try {
      const tx: InputTransactionData = {
        sender: account.address,
        data: {
          function: network === Network.DEVNET 
            ? `${aggregatorAddress}::marketplace_aggregator::purchase`
            : `${moduleAddress}::marketplace::fill_listing`,
          typeArguments: network === Network.DEVNET ? ["0x1::aptos_coin::AptosCoin"] : [],
          functionArguments: network === Network.DEVNET 
            ? [moduleAddress, nft.listing_id]
            : [nft.listing_id],
        },
      };

      const res = await signAndSubmitTransaction(tx);
      await aptos.waitForTransaction({ transactionHash: res.hash });

      toast.success("Successfully purchased NFT!");
    } catch (e) {
      console.error("Purchase failed:", e);
      toast.error("Failed to purchase NFT.");
    }
  };

  const handleCancelListing = async () => {
    if (!account?.address) {
      toast.error("Wallet not connected");
      return;
    }

    const moduleAddress = MARKETPLACE_ADDRESS_MAP[network][nft.marketplace.toLowerCase()];
    if (!moduleAddress) {
      toast.error(`Unknown marketplace: ${nft.marketplace}`);
      console.error(`Unknown marketplace: ${nft.marketplace}`);
      return;
    }

    try {
      const tx: InputTransactionData = {
        sender: account.address,
        data: {
          function: network === Network.DEVNET 
            ? `${aggregatorAddress}::marketplace_aggregator::cancel_listing`
            : `${moduleAddress}::marketplace::cancel_listing`,
          typeArguments: network === Network.DEVNET ? ["0x1::aptos_coin::AptosCoin"] : [],
          functionArguments: network === Network.DEVNET 
            ? [moduleAddress, nft.listing_id]
            : [nft.listing_id],
        },
      };

      const res = await signAndSubmitTransaction(tx);
      await aptos.waitForTransaction({ transactionHash: res.hash });

      toast.success("Successfully cancelled listing!");
    } catch (e) {
      console.error("Cancel listing failed:", e);
      toast.error("Failed to cancel listing.");
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <img
          src={nft.image_url}
          alt={nft.name}
          className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-200"
        />
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{nft.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{nft.description}</p>
        <p className="text-sm text-muted-foreground mt-2">
          by {nft.creator}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="font-semibold">
          {nft.price.amount} {nft.price.currency}
        </span>
        <Button onClick={handleBuyNow}>Buy Now</Button>
        <Button onClick={handleCancelListing}>Cancel Listing</Button>

      </CardFooter>
    </Card>
  );
};

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Wallet, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import {
  AccountAuthenticator,
  AccountInfo,
  AdapterWallet,
  AnyRawTransaction,
  AptosSignAndSubmitTransactionOutput,
  InputTransactionData,
  NetworkInfo,
  AptosSignMessageInput,
  AptosSignMessageOutput,
  AdapterNotDetectedWallet,
  AptosChangeNetworkOutput,
  PendingTransactionResponse,
  InputSubmitTransactionData,
  AptosSignInInput,
  AptosSignInOutput,
} from "@aptos-labs/wallet-adapter-core";

const ListNFTForm = ({ network }: { network: Network }) => {
  const { account, connected, connect, wallets, signAndSubmitTransaction } = useWallet();
  const aptos = new Aptos(new AptosConfig({ network }));
  const [walletNFTs, setWalletNFTs] = useState<any[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [feeSchedule, setFeeSchedule] = useState("0x1a134b39fec9caaa286ec97e65b9fef4aa1e40da42ae9135b3077cfa19cb1b5b");
  const [marketplace, setMarketplace] = useState("0x27594035ca1c038bbe322e681b7d2a9c53c58bde432626bfcdd85d19dda222a5");
  const [faMetadata, setFaMetadata] = useState("0xa");

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!account?.address) return;
      try {
        const assets = await aptos.getOwnedDigitalAssets({
          ownerAddress: account.address.toString(),
        });
        const nfts = assets.filter((a) => a.token_standard === "v2");
        setWalletNFTs(nfts);
      } catch (e) {
        console.error("Failed to fetch NFTs", e);
      }
    };
    fetchNFTs();
  }, [account?.address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNFT || !price || !feeSchedule || !marketplace || !faMetadata) return;


    try {
      const rawPrice = Number(price);
      if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
        alert("Invalid price");
        return;
      }
      const priceInOctas = BigInt(Math.floor(rawPrice * 1e8));
      if (priceInOctas > 2n ** 64n - 1n) {
        alert("Price is too large");
        return;
      }


      console.log(selectedNFT.token_data_id.toString());
      console.log(account!.address.toString());
      console.log(marketplace.toString());
      console.log(feeSchedule.toString());
      console.log(faMetadata.toString());
      console.log(priceInOctas);

      const txn: InputTransactionData = {
        sender: account!.address,
        data: {
          function: `${marketplace}::marketplace::place_listing`,
          typeArguments: [],
          functionArguments: [
            selectedNFT.token_data_id.toString(),
            feeSchedule.toString(),
            faMetadata.toString(),
            priceInOctas.toString(),
          ],
        },
      };

      const res = await signAndSubmitTransaction(txn);

      await aptos.waitForTransaction({ transactionHash: res.hash });

      alert("NFT listed successfully!");
      setSelectedNFT(null);
      setPrice("");
      setDescription("");
    } catch (err) {
      console.error("Listing failed", err);
      alert("Failed to list NFT.");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">List your NFT</h1>

      {!connected ? (
        <Card className="p-8 flex flex-col items-center justify-center text-center">
          <Wallet className="h-16 w-16 mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to access your NFTs for listing on the marketplace
          </p>
          <Button
            onClick={() => connect(wallets[0].name)}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
          </Button>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4">
            <div className="flex flex-col items-center justify-center">
              {selectedNFT ? (
                <div className="w-full space-y-4">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <img
                      src={selectedNFT.current_token_data.image_url}
                      alt={selectedNFT.current_token_data.token_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">{selectedNFT.current_token_data.token_name}</h3>
                    <p className="text-sm text-muted-foreground">Token ID: {selectedNFT.token_data_id}</p>
                    <p className="text-xs text-muted-foreground break-all">
                      Object: {selectedNFT.current_token_data.object_core}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedNFT(null)}
                    className="w-full"
                  >
                    Choose Different NFT
                  </Button>
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-40 flex flex-col gap-2">
                      <Wallet className="h-8 w-8" />
                      <span>Select NFT from your wallet</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Select an NFT to list</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      {walletNFTs.map((nft) => (
                        <div
                          key={nft.token_data_id}
                          className="border rounded-lg p-2 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => {
                            setSelectedNFT(nft);
                            document.querySelector('[role="dialog"]')?.dispatchEvent(
                              new KeyboardEvent("keydown", { key: "Escape" })
                            );
                          }}
                        >
                          <div className="aspect-square rounded-md overflow-hidden mb-2">
                            <img
                              src={nft.current_token_data.token_uri}
                              alt={nft.current_token_data.token_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm font-medium truncate">
                            {nft.current_token_data.token_name}
                          </p>
                          <p className="text-xs text-muted-foreground">ID: {nft.token_data_id}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your NFT"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Price (APT)</label>
              <div className="relative">
                <Input
                  type="number"
                  max="100000000"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pr-12"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">APT</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Fee Schedule Address</label>
              <Input
                placeholder="0xFEE_SCHEDULE_OBJECT_ADDR"
                value={feeSchedule}
                onChange={(e) => setFeeSchedule(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Marketplace Address</label>
              <Input
                placeholder="0xMARKETPLACE_MODULE_ADDR"
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">FA Metadata Object Address</label>
              <Input
                placeholder="0xFA_METADATA_OBJECT_ADDR"
                value={faMetadata}
                onChange={(e) => setFaMetadata(e.target.value)}
              />
            </div>

            <Button className="w-full" type="submit" disabled={!selectedNFT || !price}>
              List NFT
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ListNFTForm;
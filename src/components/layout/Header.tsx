import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const Header = () => {
  const { connected, account, connect, disconnect, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      if (wallets.length > 0) {
        await connect(wallets[0].name); // default to Petra
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };
        
    const shortAddr = (addr: unknown) => {
      if (typeof addr === "string") {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      }
      if (addr && typeof addr === "object" && "toString" in addr) {
        const str = (addr as { toString: () => string }).toString();
        return `${str.slice(0, 6)}...${str.slice(-4)}`;
      }
      return "Invalid Address";
    };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            NFT Market
          </h1>
        </div>
        {connected ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-muted-foreground">
              {shortAddr(account?.address)}
            </span>
            <Button variant="outline" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="flex items-center gap-2" onClick={handleConnect}>
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
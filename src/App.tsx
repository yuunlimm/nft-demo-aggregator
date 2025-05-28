import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { WalletProvider } from "./components/nft/WalletProvider"; // Ensure this is correct
import { Network } from "@aptos-labs/ts-sdk";

const queryClient = new QueryClient();

const App = ({ network }: { network: Network }) => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider network={network}> {/* 🧠 Wrap everything inside WalletProvider */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <Routes>
            <Route path="/" element={<Index network={network} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
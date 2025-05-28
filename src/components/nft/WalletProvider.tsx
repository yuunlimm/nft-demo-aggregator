// src/providers/WalletProvider.tsx (or similar)
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";

export const WalletProvider = ({ children, network }: PropsWithChildren<{ network: Network }>) => {
  return (
    <AptosWalletAdapterProvider
      optInWallets={["Petra"]} // can add more: ['Petra', 'Fewcha', 'Martian']
      autoConnect={true}
      dappConfig={{ network: network }}
      onError={(error) => {
        console.log("error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
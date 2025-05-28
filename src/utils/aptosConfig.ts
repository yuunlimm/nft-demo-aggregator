import {
  AccountInfo,
  InputTransactionData,
} from "@aptos-labs/wallet-adapter-core";
import { 
  Aptos, 
  AptosConfig, 
  Network,
  TransactionResponse,
  InputViewFunctionData,
  MoveValue 
} from "@aptos-labs/ts-sdk";

// Network configuration
const NETWORK_CONFIGS = {
  [Network.MAINNET]: new Aptos(new AptosConfig({ network: Network.MAINNET })),
  [Network.TESTNET]: new Aptos(new AptosConfig({ network: Network.TESTNET })),
  [Network.DEVNET]: new Aptos(new AptosConfig({ network: Network.DEVNET })),
} as const;

// Types
export interface TransactionContext {
  network: Network;
  account: AccountInfo | null;
  submitTransaction: (data: InputTransactionData) => Promise<TransactionResponse>;
}

// Network provider management
export class AptosService {
  private static instance: AptosService;
  private currentNetwork: Network = Network.MAINNET; // Default network

  private constructor() {}

  public static getInstance(): AptosService {
    if (!AptosService.instance) {
      AptosService.instance = new AptosService();
    }
    return AptosService.instance;
  }

  public setNetwork(network: Network) {
    this.currentNetwork = network;
  }

  public getCurrentNetwork(): Network {
    return this.currentNetwork;
  }

  public getProvider(network?: Network): Aptos {
    const targetNetwork = network || this.currentNetwork;
    const provider = NETWORK_CONFIGS[targetNetwork];
    
    if (!provider) {
      throw new Error(`Unsupported network: ${targetNetwork}`);
    }
    
    return provider;
  }

  // Transaction handling
  public async runTransaction(
    txnContext: TransactionContext,
    payload: InputTransactionData
  ): Promise<TransactionResponse | undefined> {
    try {
      const provider = this.getProvider(txnContext.network);
      const response = await txnContext.submitTransaction(payload);
      await provider.waitForTransaction({ transactionHash: response.hash });
      return await provider.getTransactionByHash({
        transactionHash: response.hash,
      });
    } catch (error) {
      console.error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // View function handling
  public async runViewFunction(
    txnContext: TransactionContext,
    payload: InputViewFunctionData
  ): Promise<MoveValue[] | undefined> {
    try {
      const provider = this.getProvider(txnContext.network);
      return await provider.view({ payload });
    } catch (error) {
      console.error(`View function failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

// Helper functions for form handling
export const onStringChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setter: (value: ((prevState: string) => string) | string) => void,
): string => {
  const val = event.target.value;
  setter(val);
  return val;
};

export const onNumberChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setter: (value: ((prevState: number) => number) | number) => void,
): void => {
  const val = event.target.value;
  setter(Number(val));
};

export const onBigIntChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setter: (value: ((prevState: bigint) => bigint) | bigint) => void,
): void => {
  const val = event.target.value;
  setter(BigInt(val));
};

// URI handling utilities
export const ensureHttps = (uri: string): string => {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
  }
  return uri;
};

export const ensureImageUri = async (uri: string): Promise<string> => {
  if (!uri) return uri;

  let newUri = ensureHttps(uri);
  try {
    if (
      !uri.endsWith(".jpg") &&
      !uri.endsWith(".jpeg") &&
      !uri.endsWith(".png") &&
      !uri.endsWith(".svg")
    ) {
      const response = await fetch(uri);
      const data = await response.json();
      if (data.image) {
        newUri = ensureHttps(data.image);
      }
    }
    return newUri;
  } catch (error) {
    return newUri;
  }
}; 
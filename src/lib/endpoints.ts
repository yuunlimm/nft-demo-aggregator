import { Network } from "@aptos-labs/ts-sdk";

interface NetworkEndpoints {
  nftIndexer: string;
  analytics: string;
}

const NETWORK_ENDPOINTS: Record<Network, NetworkEndpoints> = {
  [Network.MAINNET]: {
    nftIndexer: 'https://api.mainnet.aptoslabs.com/nft-aggregator-staging/v1/graphql',
    analytics: 'https://api.mainnet.aptoslabs.com/v1/analytics',
  },
  [Network.TESTNET]: {
    nftIndexer: 'https://api.testnet.aptoslabs.com/nft-aggregator-staging/v1/graphql',
    analytics: 'https://api.testnet.aptoslabs.com/v1/analytics',
  },
  [Network.DEVNET]: {
    nftIndexer: 'https://api.devnet.staging.aptoslabs.com/nft-aggregator-staging/v1/graphql',
    analytics: 'https://api.devnet.aptoslabs.com/v1/analytics',
  },
  [Network.LOCAL]: {
    nftIndexer: 'placeholder',
    analytics: 'placeholder',
  },
  [Network.CUSTOM]: {
    nftIndexer: 'placeholder',
    analytics: 'placeholder',
  },
};

export function getEndpoints(network: Network): NetworkEndpoints {
  const endpoints = NETWORK_ENDPOINTS[network];
  if (!endpoints) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return endpoints;
} 

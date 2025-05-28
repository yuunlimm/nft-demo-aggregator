export interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  marketplace: string;
  collection_name: string;
  creator_address: string;
  owner_address: string;
  price?: {
    amount: number;
    currency: string;
  };
  token_properties?: Record<string, string>;
  created_at: string;
  listing_id?: string;
  collection_id?: string;
  token_uri?: string;
  hasCompleteMetadata?: boolean;
  supply?: number;
  maximum?: number;
}

export interface MarketplaceConfig {
  id: string;
  name: string;
  logo_url: string;
  website_url: string;
  is_connected: boolean;
  supported_chains: string[];
  last_synced_at: string;
  rawValues: string;
}

export interface AggregatorStats {
  total_marketplaces: number;
  total_active_listings: number;
  total_value_usd?: number;
}

export interface TokenMetadata {
  cdn_image_uri?: string;
  asset_uri?: string;
  cdn_animation_uri?: string;
  raw_animation_uri?: string;
  raw_image_uri?: string;
  cdn_json_uri?: string;
} 
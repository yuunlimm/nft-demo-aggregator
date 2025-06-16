export interface CollectionData {
  collection_id?: string;
  collection_name?: string;
  total_volume_apt: string | number;
  total_sales?: number;
  floor_price_apt?: string | number;
  volume_change_percentage?: number;
}

export interface NFT {
  token_data_id: string;
  token_name: string;
  description?: string;
  token_uri?: string;
  price?: number;
  marketplace?: string;
  seller?: string;
  collection_name?: string;
  image_url?: string;
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

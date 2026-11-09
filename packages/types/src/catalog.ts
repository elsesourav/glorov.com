import type { SeedMetadata } from './botanical'

export interface StoreCatalogPrice {
  id: string
  currency_code: string
  amount: number // in paise (e.g. 4900 for ₹49)
  min_quantity?: number | null
  max_quantity?: number | null
  price_set_id?: string
}

export interface StoreCatalogVariant {
  id: string
  title: string
  sku: string | null
  manage_inventory: boolean
  allow_backorder: boolean
  prices?: StoreCatalogPrice[]
  options?: Record<string, string>
  metadata?: Record<string, unknown> | null
  inventory_quantity?: number | null
  inventory_items?: {
    inventory_item_id?: string
    variant_id?: string
    inventory?: {
      id?: string
      sku?: string | null
      location_levels?: {
        id?: string
        location_id?: string
        stocked_quantity?: number
        reserved_quantity?: number
        available_quantity?: number
      }[]
    }
  }[]
}

export interface StoreCatalogProductOption {
  id: string
  title: string
  values: {
    id: string
    value: string
  }[]
}

export interface StoreCatalogCategory {
  id: string
  name: string
  handle: string
  description?: string | null
  parent_category_id?: string | null
  category_children?: StoreCatalogCategory[]
  metadata?: Record<string, unknown> | null
}

export interface StoreCatalogCollection {
  id: string
  title: string
  handle: string
  description?: string | null
}

export interface StoreCatalogProduct {
  id: string
  title: string
  handle: string
  description: string | null
  subtitle?: string | null
  status: 'draft' | 'proposed' | 'published' | 'rejected'
  thumbnail: string | null
  created_at?: string
  updated_at?: string
  images?: { id: string; url: string }[]
  options?: StoreCatalogProductOption[]
  variants?: StoreCatalogVariant[]
  categories?: StoreCatalogCategory[]
  collection?: StoreCatalogCollection | null
  metadata?: SeedMetadata | Record<string, unknown> | null
}

export interface StoreProductFilterParams {
  limit?: number
  offset?: number
  category_id?: string[]
  collection_id?: string[]
  handle?: string
  q?: string
  fields?: string
  order?: string
}

export type CatalogSortOption =
  | 'featured'
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'title_asc'
  | 'title_desc'

export interface CatalogDiscoveryQuery {
  q?: string
  category?: string
  seed_type?: string
  season?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  packet_size?: string
  sort?: CatalogSortOption
  page?: number
  limit?: number
}


export type PlantSunlight = 'full_sun' | 'partial_shade' | 'low_light'
export type PlantWatering = 'daily' | 'alternate_days' | 'weekly' | 'dry'
export type SowingSeason = 'kharif' | 'rabi' | 'zaid' | 'all_season'
export type PlantDifficulty = 'beginner' | 'intermediate' | 'expert'
export type BotanicalCategoryType = 'seed' | 'live_plant' | 'potting_mix' | 'planter' | 'tool'

/**
 * Seed & Plant botanical specifications stored natively in Medusa product metadata.
 * All scientific and cultivation fields are optional to handle unknown or inapplicable data cleanly.
 */
export interface SeedMetadata {
  common_name?: string
  botanical_name?: string
  seed_type?: 'heirloom' | 'hybrid' | 'open_pollinated' | 'organic' | string
  variety?: string
  approx_seeds_per_packet?: number | string
  germination_time_range?: string
  sowing_depth?: string
  spacing?: string
  sunlight?: PlantSunlight
  watering?: PlantWatering
  season?: SowingSeason
  difficulty?: PlantDifficulty
  days_to_harvest?: string
  planting_instructions?: string
  packaging_notes?: string
  is_perishable?: boolean
  [key: string]: unknown
}

/**
 * Variant-level metadata for packet-size options.
 */
export interface SeedVariantMetadata {
  packet_size_label?: string
  approx_seeds_per_packet?: number
  weight_grams?: number
  [key: string]: unknown
}

/**
 * Inventory availability status and quantities for variants.
 */
export type InventoryStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'untracked'

export interface InventoryAvailability {
  isAvailable: boolean
  status: InventoryStockStatus
  manageInventory: boolean
  allowBackorder: boolean
  stockedQuantity: number
  reservedQuantity: number
  availableQuantity: number
}

/**
 * Computes standard inventory availability given Medusa variant and inventory levels.
 */
export function computeVariantAvailability(params: {
  manageInventory?: boolean | null
  allowBackorder?: boolean | null
  stockedQuantity?: number | null
  reservedQuantity?: number | null
}): InventoryAvailability {
  const manageInventory = params.manageInventory ?? true
  const allowBackorder = params.allowBackorder ?? false
  const stockedQuantity = Math.max(0, params.stockedQuantity ?? 0)
  const reservedQuantity = Math.max(0, params.reservedQuantity ?? 0)
  const availableQuantity = Math.max(0, stockedQuantity - reservedQuantity)

  if (!manageInventory) {
    return {
      isAvailable: true,
      status: 'untracked',
      manageInventory: false,
      allowBackorder: true,
      stockedQuantity,
      reservedQuantity,
      availableQuantity,
    }
  }

  if (availableQuantity > 0) {
    return {
      isAvailable: true,
      status: availableQuantity <= 10 ? 'low_stock' : 'in_stock',
      manageInventory: true,
      allowBackorder,
      stockedQuantity,
      reservedQuantity,
      availableQuantity,
    }
  }

  if (allowBackorder) {
    return {
      isAvailable: true,
      status: 'low_stock',
      manageInventory: true,
      allowBackorder: true,
      stockedQuantity,
      reservedQuantity,
      availableQuantity: 0,
    }
  }

  return {
    isAvailable: false,
    status: 'out_of_stock',
    manageInventory: true,
    allowBackorder: false,
    stockedQuantity,
    reservedQuantity,
    availableQuantity: 0,
  }
}

/**
 * Safely parse raw product metadata into typed SeedMetadata.
 */
export function parseSeedMetadata(rawMetadata: unknown): SeedMetadata {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return {}
  }
  const meta = rawMetadata as Record<string, unknown>
  return {
    ...meta,
    common_name: typeof meta.common_name === 'string' && meta.common_name.trim() ? meta.common_name.trim() : undefined,
    botanical_name: typeof meta.botanical_name === 'string' && meta.botanical_name.trim() ? meta.botanical_name.trim() : undefined,
    seed_type: typeof meta.seed_type === 'string' && meta.seed_type.trim() ? meta.seed_type.trim() : undefined,
    variety: typeof meta.variety === 'string' && meta.variety.trim() ? meta.variety.trim() : undefined,
    approx_seeds_per_packet:
      typeof meta.approx_seeds_per_packet === 'number' || typeof meta.approx_seeds_per_packet === 'string'
        ? meta.approx_seeds_per_packet
        : undefined,
    germination_time_range:
      typeof meta.germination_time_range === 'string' && meta.germination_time_range.trim() ? meta.germination_time_range.trim() : undefined,
    sowing_depth: typeof meta.sowing_depth === 'string' && meta.sowing_depth.trim() ? meta.sowing_depth.trim() : undefined,
    spacing: typeof meta.spacing === 'string' && meta.spacing.trim() ? meta.spacing.trim() : undefined,
    sunlight: typeof meta.sunlight === 'string' ? (meta.sunlight as PlantSunlight) : undefined,
    watering: typeof meta.watering === 'string' ? (meta.watering as PlantWatering) : undefined,
    season: typeof meta.season === 'string' ? (meta.season as SowingSeason) : undefined,
    difficulty: typeof meta.difficulty === 'string' ? (meta.difficulty as PlantDifficulty) : undefined,
    days_to_harvest:
      typeof meta.days_to_harvest === 'string' && meta.days_to_harvest.trim()
        ? meta.days_to_harvest.trim()
        : typeof meta.estimated_days_to_harvest === 'string' && meta.estimated_days_to_harvest.trim()
        ? meta.estimated_days_to_harvest.trim()
        : undefined,
    planting_instructions:
      typeof meta.planting_instructions === 'string' && meta.planting_instructions.trim() ? meta.planting_instructions.trim() : undefined,
    packaging_notes: typeof meta.packaging_notes === 'string' && meta.packaging_notes.trim() ? meta.packaging_notes.trim() : undefined,
    is_perishable: typeof meta.is_perishable === 'boolean' ? meta.is_perishable : false,
  }
}

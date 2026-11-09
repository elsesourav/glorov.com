export type ServiceabilityStatus = 'confirmed' | 'rejected' | 'undetermined'

export type ShippingRateSource = 'live_courier' | 'configured_estimate'

export interface PincodeServiceabilityRequest {
  pincode: string
  weight_kg?: number
  is_perishable?: boolean
  cod?: boolean
  declared_value_inr?: number
}

export interface PincodeServiceabilityResponse {
  pincode: string
  serviceable: boolean
  status?: ServiceabilityStatus
  city?: string
  state?: string
  prepaid_eligible?: boolean
  cod_available: boolean // Preserved for backwards compatibility
  cod_eligible?: boolean
  cod_restriction_reason?: string | null
  estimated_days?: number
  courier_name?: string
  rate_inr?: number
  rate_source?: ShippingRateSource
  message?: string
}

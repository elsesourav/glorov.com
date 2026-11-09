import { z } from "zod";

/**
 * Indian PIN code validation schema:
 * 6 digits, cannot start with 0.
 */
export const indianPincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, {
    message: "Enter a valid 6-digit Indian PIN code (e.g. 411001, 560001)",
  });

/**
 * Indian 10-digit mobile phone number schema:
 * Standard Indian cellular prefixes (6, 7, 8, 9).
 */
export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9][0-9]{9}$/, {
    message: "Enter a valid 10-digit Indian mobile number",
  });

/**
 * Indian Delivery Address Schema
 */
export const indianAddressSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  address_1: z.string().min(5, "Flat/House No. and Street address are required"),
  address_2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "State/Province is required"),
  postal_code: indianPincodeSchema,
  phone: indianPhoneSchema,
  country_code: z.literal("in").default("in"),
});

export type IndianAddressInput = z.infer<typeof indianAddressSchema>;

/**
 * Botanical Catalog Filter Schema
 */
export const botanicalFilterSchema = z.object({
  category: z.enum(["seeds", "plants", "planters", "care"]).optional(),
  sunlight: z.enum(["full_sun", "partial_shade", "low_light"]).optional(),
  watering: z.enum(["daily", "alternate_days", "weekly", "dry"]).optional(),
  isPerishable: z.boolean().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
});

export type BotanicalFilterInput = z.infer<typeof botanicalFilterSchema>;

/**
 * Seed & Plant metadata validation schema.
 * Supports all botanical attributes for seeds and plants; all fields are optional.
 */
export const seedMetadataSchema = z.object({
  common_name: z.string().trim().min(1).nullish(),
  botanical_name: z.string().trim().min(1).nullish(),
  seed_type: z.string().trim().min(1).nullish(),
  variety: z.string().trim().min(1).nullish(),
  approx_seeds_per_packet: z.union([z.number().positive(), z.string().trim().min(1)]).nullish(),
  germination_time_range: z.string().trim().min(1).nullish(),
  sowing_depth: z.string().trim().min(1).nullish(),
  spacing: z.string().trim().min(1).nullish(),
  sunlight: z.enum(["full_sun", "partial_shade", "low_light"]).nullish(),
  watering: z.enum(["daily", "alternate_days", "weekly", "dry"]).nullish(),
  season: z.enum(["kharif", "rabi", "zaid", "all_season"]).nullish(),
  difficulty: z.enum(["beginner", "intermediate", "expert"]).nullish(),
  days_to_harvest: z.string().trim().min(1).nullish(),
  planting_instructions: z.string().trim().min(1).nullish(),
  packaging_notes: z.string().trim().min(1).nullish(),
  is_perishable: z.boolean().default(false),
}).passthrough();

export type SeedMetadataInput = z.infer<typeof seedMetadataSchema>;

/**
 * Variant packet size metadata schema.
 */
export const seedVariantMetadataSchema = z.object({
  packet_size_label: z.string().trim().min(1).nullish(),
  approx_seeds_per_packet: z.number().int().positive().nullish(),
  weight_grams: z.number().positive().nullish(),
}).passthrough();

export type SeedVariantMetadataInput = z.infer<typeof seedVariantMetadataSchema>;

export const optionalIndianPhoneSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || /^[6-9][0-9]{9}$/.test(val),
    "Please enter a valid 10-digit Indian mobile number (starts with 6-9)"
  )
  .or(z.literal(""));

/**
 * Customer Authentication & Profile Schemas
 */
export const customerRegistrationSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: optionalIndianPhoneSchema,
});

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>;

export const customerLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export const customerProfileUpdateSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  phone: optionalIndianPhoneSchema,
  company_name: z.string().trim().optional().or(z.literal("")),
});

export type CustomerProfileUpdateInput = z.infer<typeof customerProfileUpdateSchema>;

export const customerPasswordUpdateSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export type CustomerPasswordUpdateInput = z.infer<typeof customerPasswordUpdateSchema>;

export const customerPasswordResetSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export type CustomerPasswordResetInput = z.infer<typeof customerPasswordResetSchema>;

export const customerAddressInputSchema = z.object({
  address_name: z.string().trim().optional(),
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  address_1: z.string().trim().min(5, "Flat/House No. and Street address are required"),
  address_2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  province: z.string().trim().min(2, "State/Province is required"),
  postal_code: indianPincodeSchema,
  phone: indianPhoneSchema,
  country_code: z.literal("in").default("in"),
  is_default_shipping: z.boolean().optional(),
  is_default_billing: z.boolean().optional(),
});

export type CustomerAddressInput = z.infer<typeof customerAddressInputSchema>;

/**
 * Order Cancellation Schema
 */
export const orderCancellationSchema = z.object({
  reason: z.string().trim().min(1, "Cancellation reason is required").default("Customer requested cancellation"),
  customer_note: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  order_email: z.string().trim().toLowerCase().email().optional(),
});

export type OrderCancellationInput = z.infer<typeof orderCancellationSchema>;

/**
 * Return Request Item Schema
 */
export const returnReasonEnum = z.enum([
  "damaged_in_transit",
  "defective_quality",
  "wrong_item",
  "expired_viability",
  "changed_mind_unopened",
  "other",
]);

export type ReturnReason = z.infer<typeof returnReasonEnum>;

export const orderReturnItemSchema = z.object({
  line_item_id: z.string().min(1, "Line item ID is required"),
  quantity: z.number().int().positive("Return quantity must be at least 1"),
  reason: returnReasonEnum,
  customer_note: z.string().trim().optional(),
});

export type OrderReturnItemInput = z.infer<typeof orderReturnItemSchema>;

export const orderReturnRequestSchema = z.object({
  items: z.array(orderReturnItemSchema).min(1, "At least one item must be selected for return"),
  customer_notes: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  order_email: z.string().trim().toLowerCase().email().optional(),
});

export type OrderReturnRequestInput = z.infer<typeof orderReturnRequestSchema>;

/**
 * Admin Review Return Request Schema
 */
export const adminReturnReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  decision_notes: z.string().trim().min(1, "Decision notes are required"),
  customer_note: z.string().trim().optional(),
  return_action: z.enum(["approve_with_refund", "approve_exchange", "reject"]).default("approve_with_refund"),
  refund_amount_inr: z.number().positive().optional(),
  return_shipping_required: z.boolean().default(false),
});

export type AdminReturnReviewInput = z.infer<typeof adminReturnReviewSchema>;

/**
 * Admin Refund Execution Schema
 */
export const adminRefundSchema = z.object({
  payment_id: z.string().optional(),
  amount_inr: z.number().positive("Refund amount must be positive"),
  reason: z.string().trim().default("Customer return or order adjustment"),
  note: z.string().trim().optional(),
  idempotency_key: z.string().trim().optional(),
});

export type AdminRefundInput = z.infer<typeof adminRefundSchema>;

/**
 * Admin COD Refund Schema (Bank Transfer UTR)
 */
export const adminCodRefundSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
  amount_inr: z.number().positive("Refund amount must be positive"),
  bank_account_number: z.string().trim().min(8, "Valid bank account number is required"),
  bank_ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Valid 11-character Indian IFSC code required (e.g. HDFC0001234)"),
  account_holder_name: z.string().trim().min(2, "Account holder name is required"),
  bank_name: z.string().trim().optional(),
  bank_utr: z.string().trim().min(6, "Valid bank UTR / NEFT reference number is required"),
  payout_date: z.string().trim().optional(),
  reason: z.string().trim().default("COD Order return settlement"),
});

export type AdminCodRefundInput = z.infer<typeof adminCodRefundSchema>;

/**
 * Botanical Return Inventory Triage Schema
 */
export const returnConditionEnum = z.enum([
  "unopened_sealed_seeds",
  "damaged_unsellable",
  "perishable_spoilage",
  "quarantine_salvage",
]);

export type ReturnCondition = z.infer<typeof returnConditionEnum>;

export const inventoryTriageItemSchema = z.object({
  line_item_id: z.string().min(1, "Line item ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  condition: returnConditionEnum,
  restock: z.boolean().default(false),
  notes: z.string().trim().optional(),
});

export const returnInventoryTriageSchema = z.object({
  items: z.array(inventoryTriageItemSchema).min(1, "At least one item required for triage"),
  triage_notes: z.string().trim().optional(),
});

export type ReturnInventoryTriageInput = z.infer<typeof returnInventoryTriageSchema>;

/**
 * Cash on Delivery (COD) threshold limits.
 * Medusa core represents INR in minor units (paise).
 * ₹5,000 max limit = 500,000 paise.
 */
export const COD_MAX_AMOUNT_PAISE = 500000;
export const COD_MAX_AMOUNT_RUPEES = 5000;

/**
 * Checks if an amount is eligible for Cash on Delivery.
 * Enforces strict comparison in paise minor units against COD_MAX_AMOUNT_PAISE (500,000 paise).
 *
 * @param amount Amount in paise (integer) or rupees (if unit is specified as 'rupees')
 * @param unit 'paise' (default, Medusa minor units) or 'rupees'
 */
export function isCodAmountEligible(
  amount: number,
  unit: 'paise' | 'rupees' = 'paise'
): boolean {
  if (amount <= 0 || isNaN(amount)) return false;
  const amountInPaise = unit === 'rupees' ? Math.round(amount * 100) : Math.round(amount);
  return amountInPaise <= COD_MAX_AMOUNT_PAISE;
}





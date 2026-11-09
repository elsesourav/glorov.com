# ADR-0005: Indian Payment & Logistics Provider Boundaries (Razorpay, COD, Shiprocket)

- **Status:** Accepted
- **Date:** October 2026
- **Deciders:** Architecture Team, Integration Lead

## Context & Problem Statement
Operating direct-to-consumer e-commerce in India requires specialized payment gateways and shipping aggregators:
1. **Payments:** High preference for Unified Payments Interface (UPI - Google Pay, PhonePe, Paytm), domestic debit cards (RuPay), and Cash on Delivery (COD). Global gateways like Stripe lack deep UPI Intent and Indian domestic card optimization.
2. **Logistics:** Direct multi-carrier shipping across 19,000+ Indian pincodes requires multi-courier aggregation (Delhivery, BlueDart, DTDC, Xpressbees) with automated Air Waybill (AWB) generation, reverse pickups, and cash reconciliation.

## Considered Alternatives
1. **Global Aggregators (Stripe, DHL/FedEx API):**
   - *Pros:* Standardized international SDKs.
   - *Cons:* Extremely high domestic fees; lack of native UPI QR/intent flow; prohibitive courier rates for domestic sub-₹500 seed orders.
2. **Indian Competitors (PayU, Cashfree, Shipway, Pickrr):**
   - *Pros:* Viable domestic alternatives.
   - *Cons:* Razorpay and Shiprocket have the widest domestic market adoption, best documented REST APIs, and the most robust webhook ecosystems.
3. **Custom Architectural Provider Boundaries:**
   - Implement standalone Medusa v2 modules:
     - `payment-razorpay`: Implements `AbstractPaymentProvider`. Converts Medusa decimal amounts to paise (integer multiplication), initiates Razorpay Orders, verifies HMAC-SHA256 signatures, and processes refunds.
     - `payment-cod`: Dedicated payment provider enforcing a maximum order cap of ₹5,000 (500,000 paise).
     - `fulfillment-shiprocket`: Implements `AbstractFulfillmentProvider`. Calculates real-time rates, validates serviceable pincodes, requests shipments, and processes tracking webhooks.

## Decision
We chose **Razorpay** as the primary online payment gateway, **COD** as a guarded secondary payment method, and **Shiprocket** as the logistics aggregator, encapsulating each within custom Medusa v2 modules.

### Architectural Boundaries & Security Controls
1. **Razorpay Module Boundaries (`apps/backend/src/modules/payment-razorpay`):**
   - *Timing-Safe HMAC Verification:* All webhook signatures and payment response signatures are validated using Node.js `crypto.timingSafeEqual` to prevent timing attacks.
   - *Paise Invariant:* All monetary amounts exchanged with Razorpay are strictly converted to integer paise (`1 INR = 100 paise`).
   - *Mock Mode Guard:* In local development and automated testing, mock modes operate safely. In production (`NODE_ENV === 'production'`), runtime validator [`validateProductionConfig()`](file:///Users/sourav/Developer/WEB/top-projects/glorov/apps/backend/medusa-config.ts) throws a fatal error if `RAZORPAY_MOCK_MODE=true` is set.
2. **COD Module Boundaries (`apps/backend/src/modules/payment-cod`):**
   - *Hard Ceiling:* Orders exceeding ₹5,000 (configurable via `COD_MAX_AMOUNT_PAISE`) cannot select COD, mitigating Return to Origin (RTO) courier loss on perishable live plants.
   - *Uncaptured Status:* Payment status remains uncaptured upon checkout; settlement occurs upon physical courier cash collection.
3. **Shiprocket Module Boundaries (`apps/backend/src/modules/fulfillment-shiprocket`):**
   - *Serviceability Guard:* Validates 6-digit Indian PIN codes against serviceable delivery areas.
   - *Fallback Rates:* If Shiprocket API is temporarily unreachable, fallback flat rates apply (₹49 standard surface, ₹99 express air) to prevent customer checkout abandonment.
   - *Public Tracking Sanitization:* The public AWB lookup endpoint strips sensitive customer PII, exposing only courier milestone events.

## Consequences & Trade-offs
- **Positive:** Flawless domestic payment and fulfillment experience for Indian shoppers, robust cryptographic validation, complete isolation of external provider code inside modular boundaries.
- **Negative:** Requires external account onboarding, KYC verification, and wallet balance management by the business owner.

# ADR-0001: Use Medusa v2 as the Headless Modular Commerce Engine

- **Status:** Accepted
- **Date:** October 2026
- **Deciders:** Architecture Team, Engineering Lead

## Context & Problem Statement
GLOROV is an Indian direct-to-consumer e-commerce brand selling agricultural seeds (heirloom, desi varieties) and live potted nursery plants. The commerce platform must support:
1. Indian statutory requirements (INR currency, HSN codes: 1209 exempt seeds @ 0% GST, 0602 live plants @ 0%/5% GST, 6-digit PIN validation).
2. Specialized botanical attributes (sunlight, watering frequency, germination days, packet-size variants like 20/50/100 seeds).
3. Indian domestic payment gateways (Razorpay UPI/Cards/NetBanking, Cash on Delivery with order limits).
4. Indian domestic fulfillment aggregators (Shiprocket multi-courier dispatch from Pune Hub, PIN 411001).
5. Fast, custom headless frontend with modern developer ergonomics.

## Considered Alternatives
1. **Shopify Plus / Advanced:** Hosted SaaS solution.
   - *Pros:* Turnkey hosted infrastructure, built-in checkout.
   - *Cons:* Vendor lock-in, high recurring monthly costs plus transaction percentage fees; limited flexibility for custom botanical inventory workflows; rigid checkout customization unless on expensive Enterprise tiers; difficult to implement custom courier logistics like Shiprocket without proprietary third-party apps.
2. **WooCommerce / WordPress:** Open-source PHP monolith.
   - *Pros:* Large plugin ecosystem, low initial barrier to entry.
   - *Cons:* Fragile plugin architecture, security vulnerabilities, poor TypeScript integration, monolithic tightly-coupled rendering model, difficult to scale cleanly without significant operational overhead.
3. **Custom Commerce Engine from Scratch (Node.js/NestJS/Express):**
   - *Pros:* Total control over schema and workflows.
   - *Cons:* Enormous engineering investment to re-implement core commerce mechanics (cart line calculation, inventory locks, payment collections, order lifecycle, return requests, tax resolution). High risk of edge-case bugs and inventory race conditions.
4. **Medusa v2 (Modular Node.js Commerce Engine):**
   - *Pros:* Open-source, TypeScript-native, headless by default; modular architecture (modules for payment, fulfillment, notification, inventory, order); powerful workflow engine with step-by-step compensations; native multi-location inventory; built-in modern React Admin dashboard; full ownership of data and infrastructure.
   - *Cons:* Requires self-hosting and DevOps management; Medusa v2 introduces breaking architectural changes from v1 (DML, workflow framework).

## Decision
We chose **Medusa v2** as the core commerce backend.

### Rationale
- **Modular Framework:** Custom payment providers (`payment-razorpay`, `payment-cod`), fulfillment providers (`fulfillment-shiprocket`), and notification modules (`notification-email`) integrate natively through Medusa's standard service contracts.
- **Workflow Engine:** Medusa v2 workflows provide transactional guarantees with compensation steps, preventing inconsistent states across orders, payments, and inventory.
- **Multi-Location Inventory:** Supports atomic reservations at specific stock locations (Pune Central Nursery Hub), preventing overselling during traffic spikes.
- **Data Ownership:** All customer, product, and order records reside in our self-hosted PostgreSQL database, complying with Indian data sovereignty principles.

## Consequences & Trade-offs
- **Positive:** Full customization freedom, zero platform fees per transaction, unified TypeScript monorepo with storefront.
- **Negative:** Requires active maintenance of PostgreSQL, Redis, and backend runtime environments; developer must understand Medusa v2 workflow lifecycle.

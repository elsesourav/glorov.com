# ADR-0004: Reuse Native Medusa Commerce Workflows

- **Status:** Accepted
- **Date:** October 2026
- **Deciders:** Architecture Team, Backend Lead

## Context & Problem Statement
When implementing custom commerce features (cancellations, returns, refunds, inventory triage, custom payment verification), engineering teams face a fundamental architectural choice:
1. Build a parallel, custom order-management state machine with custom tables and endpoints.
2. Extend and reuse Medusa v2's native commerce workflows and domain modules.

Building parallel order and inventory systems introduces significant risks:
- "Split-brain" states where an order is cancelled in a custom table but remains active in Medusa core.
- Bypassed inventory reservations, resulting in phantom stock or overselling.
- Incompatible payment collection records, preventing automated refunds.
- Maintenance burden of writing custom rollback and compensation logic for failed steps.

## Considered Alternatives
1. **Parallel Custom Order & Return Subsystem:**
   - Create custom PostgreSQL tables (`glorov_returns`, `glorov_cancellations`) and independent REST endpoints.
   - *Pros:* Complete freedom in schema design without studying Medusa internal APIs.
   - *Cons:* High probability of data inconsistency; requires re-implementing inventory adjustments, payment refund calls, and order status sync manually. Breaks Medusa Admin dashboard visibility.
2. **Reuse Native Medusa v2 Workflows & Events:**
   - Execute native Medusa workflow functions: `cancelOrderWorkflow`, `createReturnWorkflow`, `createRefundOrdersWorkflow`, `createFulfillmentWorkflow`.
   - Wrap custom business requirements (such as customer authorization ownership checks and botanical inventory triage write-offs) as pre-workflow validation or custom workflow steps.

## Decision
We decided to **strictly reuse native Medusa v2 workflows** for all order, return, refund, fulfillment, and inventory operations.

### Rationale
- **Single Source of Truth:** The Medusa core database models (`order`, `order_change`, `return`, `refund`, `reservation_item`) remain the authoritative record.
- **Automated Rollback & Compensations:** Medusa v2 workflows define explicit compensation steps. If a refund fails on Razorpay, preceding order changes roll back automatically.
- **Admin Dashboard Compatibility:** Because native workflows update core Medusa entities, operations staff can manage orders, fulfillments, and returns directly within the standard Medusa Admin UI without bespoke admin screens.
- **Horticultural Customizations as Decorators:**
  - *Customer Cancellation:* Validates order ownership via `validateOrderOwnership` and fulfillment status before calling native `cancelOrderWorkflow`.
  - *Botanical Return Triage:* When reviewing return requests, damaged live plants are written off (not restocked), while sealed seed packets are returned to Pune Hub inventory using Medusa's native inventory adjustments.

## Consequences & Trade-offs
- **Positive:** Zero split-brain discrepancies, robust rollback mechanisms, full Admin UI compatibility, less custom boilerplate code.
- **Negative:** Requires strict adherence to Medusa v2 SDK and workflow conventions; requires understanding Medusa's order-edit and order-change lifecycle.

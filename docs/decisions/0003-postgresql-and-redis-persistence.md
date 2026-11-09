# ADR-0003: PostgreSQL 16 and Redis 7 as Persistence and Job Queue Layer

- **Status:** Accepted
- **Date:** October 2026
- **Deciders:** Architecture Team, DevOps Lead

## Context & Problem Statement
E-commerce backends require strict ACID transactions for order placement and inventory reservation, alongside fast, non-blocking asynchronous event processing for external webhooks, email notifications, and courier dispatch.

The storage layer must support:
1. Strong relational integrity across carts, orders, payment sessions, line items, and stock locations.
2. JSONB metadata storage for arbitrary botanical attributes (germination rate, sunlight requirements, potting instructions).
3. Asynchronous job queues and publish/subscribe message brokers for Medusa event subscribers (e.g., `order.placed`, `payment.captured`, `shipment.created`).
4. High availability, automated backup, and point-in-time recovery capabilities.

## Considered Alternatives
1. **MongoDB / NoSQL Document Stores:**
   - *Pros:* Flexible schema for varied botanical product attributes.
   - *Cons:* Poor support for complex relational joins (orders -> items -> variants -> inventory levels -> stock locations); weaker transactional guarantees during multi-item inventory reservations.
2. **MySQL 8.0:**
   - *Pros:* Widely used relational database.
   - *Cons:* Medusa v2 natively targets PostgreSQL and uses MikroORM / PostgreSQL-specific features; less powerful JSONB operators and index capabilities.
3. **PostgreSQL 16 + Redis 7:**
   - *Pros:* PostgreSQL 16 offers battle-tested ACID transactions, advanced JSONB indexing, row-level locking for inventory concurrency, and native Medusa v2 support. Redis 7 provides in-memory caching and acts as the BullMQ broker for Medusa's event bus and background workflows.

## Decision
We chose **PostgreSQL 16** as the primary relational database and **Redis 7** as the cache and job queue broker.

### Rationale
- **Relational Consistency:** Prevents duplicate order placement or orphaned cart sessions.
- **Inventory Concurrency:** Row-level locks in PostgreSQL combined with Medusa's native inventory reservation system guarantee zero overselling under concurrent load (verified under 6-thread concurrency tests).
- **Decoupled Asynchronous Processing:** Redis BullMQ queues allow critical operations (customer checkout) to complete in <300ms while offloading slow external API calls (Shiprocket order creation, SMTP email dispatch) to background workers.
- **Docker Parity:** Local development uses Docker Compose (`docker compose up -d postgres redis`), ensuring identical runtime environments between local development and production.

## Consequences & Trade-offs
- **Positive:** Rock-solid transactional integrity, sub-millisecond cache latency, clean separation of synchronous API processing from asynchronous workers.
- **Negative:** Requires running two stateful services; requires connection pool tuning (`DB_POOL_MIN`, `DB_POOL_MAX`) to prevent connection starvation.

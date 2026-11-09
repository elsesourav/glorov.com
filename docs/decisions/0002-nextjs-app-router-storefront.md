# ADR-0002: Use Next.js 15 App Router for the Storefront

- **Status:** Accepted
- **Date:** October 2026
- **Deciders:** Architecture Team, Frontend Lead

## Context & Problem Statement
The GLOROV storefront is the public-facing digital flagship. It requires:
1. Exceptional search engine visibility (SEO) to attract organic traffic searching for regional Indian seed varieties (e.g., "Desi Tomato Seeds Pune", "Organic Holy Basil Seeds").
2. Fast initial page rendering and low Cumulative Layout Shift (CLS) on mobile 3G/4G/5G connections in India.
3. Accessible, responsive UI compatible with screen readers and mobile tap targets (WCAG 2.1 AA).
4. Secure server-side execution for cart mutation, payment session initialization, and customer authentication without leaking backend secrets.

## Considered Alternatives
1. **Single Page Application (SPA) with Vite + React:**
   - *Pros:* Fast client-side transitions after initial bundle load, simple build output.
   - *Cons:* Client-side rendering hinders SEO indexing and social media OpenGraph sharing; large initial JS bundle degrades performance on low-end mobile hardware; requires browser-facing API keys for all queries.
2. **Static Site Generation (SSG) with Gatsby or Astro:**
   - *Pros:* Ultra-fast static HTML file delivery via CDN.
   - *Cons:* Inadequate for dynamic real-time inventory counts, customer accounts, and interactive checkout; rebuilds required for product price updates.
3. **Remix / React Router v7:**
   - *Pros:* Excellent nested routing and loader/action patterns.
   - *Cons:* Smaller ecosystem and community integrations compared to Next.js; less turnkey image optimization tooling compared to `next/image`.
4. **Next.js 15 with App Router (React Server Components):**
   - *Pros:* Hybrid rendering model: React Server Components (RSC) fetch catalog data securely on the server with zero client bundle overhead; Server Actions enable progressive cart updates; built-in image optimization (`next/image` with WebP/AVIF); automatic OpenGraph and JSON-LD schema generation; seamless edge middleware support.

## Decision
We chose **Next.js 15 with the App Router** for the GLOROV storefront.

### Rationale
- **SEO & Discovery:** Product Detail Pages (`/products/[handle]`) and Category Pages (`/categories/[...category]`) render server-side with structured JSON-LD (`Product`, `BreadcrumbList`, `AggregateOffer`) for immediate search engine indexing.
- **Performance:** Dynamic imports, streaming with Suspense, and automatic image compression minimize mobile data usage.
- **Security Boundaries:** Server actions and route handlers keep backend credentials and API keys completely off the client browser.
- **Design System Integration:** Tailwind CSS with shadcn/ui provides accessible, themeable UI components tailored with a botanical color palette.

## Consequences & Trade-offs
- **Positive:** Maximum search visibility, excellent Core Web Vitals, tight type safety with shared types package (`@glorov/types`).
- **Negative:** Requires Node.js server runtime (or standalone Docker container) rather than cheap static hosting buckets.

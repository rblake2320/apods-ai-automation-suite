# APODS Tech Stack Roadmap

## Platform Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT LAYER                       │
├──────────┬──────────┬──────────┬─────────────────────┤
│  Kiosk   │ Mobile   │ Web      │ Admin Portal        │
│ Firmware │ App (RN) │ App      │ (B2B Dashboard)     │
│ C++/Rust │ React    │ React/   │ React + Tailwind    │
│          │ Native   │ Next.js  │                     │
└────┬─────┴────┬─────┴────┬─────┴─────────┬───────────┘
     │          │          │               │
┌────┴──────────┴──────────┴───────────────┴───────────┐
│                    API GATEWAY                        │
│           Kong / AWS API Gateway / Cloudflare         │
├──────────────────────────────────────────────────────┤
│                  SERVICES LAYER                       │
├───────────┬───────────┬───────────┬──────────────────┤
│ Card      │ Identity  │ Payment   │ Gift Card        │
│ Issuance  │ & KYC     │ Processing│ Marketplace      │
│ Service   │ Service   │ Service   │ Service          │
├───────────┼───────────┼───────────┼──────────────────┤
│ Ad        │ Bank      │ Badge/ID  │ Crypto           │
│ Platform  │ Licensing │ Issuance  │ Engine           │
│ Service   │ Service   │ Service   │ Service          │
├───────────┼───────────┼───────────┼──────────────────┤
│ AI Design │ Analytics │ Compliance│ Notification     │
│ Engine    │ Engine    │ Engine    │ Service          │
└───────────┴───────────┴───────────┴──────────────────┘
│                    DATA LAYER                        │
├───────────┬───────────┬───────────┬──────────────────┤
│ PostgreSQL│ Redis     │ S3/R2    │ TimescaleDB      │
│ (Primary) │ (Cache)   │ (Assets) │ (Time-series)    │
└───────────┴───────────┴───────────┴──────────────────┘
```

---

## Build Phases

### Phase 1: Foundation (Months 1-6) — MVP
**Goal:** Working kiosk + app that can print a basic card

**Core Platform:**
- [ ] API Gateway (Kong or Cloudflare Workers)
- [ ] Auth service (JWT + biometric enrollment)
- [ ] User management microservice
- [ ] PostgreSQL schema + migrations (Prisma ORM)
- [ ] Redis caching layer
- [ ] CI/CD pipeline (GitHub Actions → AWS/Cloudflare)

**Kiosk Firmware:**
- [ ] Embedded Linux base image (Yocto or Ubuntu Core)
- [ ] Card printer driver integration (Evolis, Matica, or Entrust)
- [ ] EMV chip encoding module
- [ ] NFC/RFID writer integration
- [ ] Biometric reader SDK (fingerprint + camera)
- [ ] Local queue management (offline capability)
- [ ] OTA update system

**Mobile App (React Native):**
- [ ] User registration + KYC flow
- [ ] Card gallery / design browser
- [ ] QR code for kiosk authentication
- [ ] Push notification integration
- [ ] Apple Pay / Google Pay wallet push

**Card Issuance Service:**
- [ ] Card design template engine (SVG → print-ready)
- [ ] Visa/MC BIN management
- [ ] Card personalization API
- [ ] Print job queue + status tracking

**Compliance:**
- [ ] PCI-DSS Level 1 assessment prep
- [ ] BIPA/CCPA consent management
- [ ] Audit logging service
- [ ] HSM integration for key management

---

### Phase 2: Revenue Engines (Months 6-12)
**Goal:** Launch subscription tiers + B2B platform

**Subscription & Billing:**
- [ ] Stripe integration (subscriptions + metered billing)
- [ ] Tier management (Free/Basic/Premium/Elite)
- [ ] Annual plan billing cycles
- [ ] Family plan user linking
- [ ] Usage metering (cards printed, designs created)

**AI Design Engine:**
- [ ] Stable Diffusion / DALL-E integration for card art
- [ ] Template-based design system
- [ ] Brand guidelines enforcement
- [ ] AR card preview (camera overlay)

**B2B Platform:**
- [ ] Multi-tenant admin portal
- [ ] Bank/CU onboarding workflow
- [ ] Kiosk fleet management dashboard
- [ ] API key management + rate limiting
- [ ] Usage analytics + reporting
- [ ] White-label theming engine

**Gift Card Marketplace:**
- [ ] Retailer onboarding + listing management
- [ ] Digital gift card delivery engine
- [ ] Exchange/swap matching engine
- [ ] Fraud detection for gift card trading

---

### Phase 3: Monetization Expansion (Months 12-18)
**Goal:** Launch advertising, bank licensing, badge issuance

**Ad Platform:**
- [ ] Ad inventory management (kiosk + app placements)
- [ ] Campaign creation + targeting UI
- [ ] Real-time bidding engine (RTB)
- [ ] Impression tracking + attribution
- [ ] CPM/CPC/CPA billing engine
- [ ] Sponsored card design gallery
- [ ] Advertiser self-serve portal

**Bank Licensing (KaaS):**
- [ ] KaaS tier configuration (Basic/Standard/Enterprise/White-Label)
- [ ] Remote kiosk provisioning + monitoring
- [ ] Card stock inventory management (per-kiosk)
- [ ] SLA monitoring + alerting
- [ ] Bank-specific branding packages
- [ ] Revenue share calculation engine

**Badge/ID Issuance:**
- [ ] RFID/HID card encoding support
- [ ] PIV/CAC card compatibility
- [ ] Visitor management integration
- [ ] Bulk badge order API
- [ ] Expiration + access control metadata
- [ ] Event badge template system

---

### Phase 4: Crypto & Global (Months 18-30)
**Goal:** Crypto services + international expansion

**Crypto Engine:**
- [ ] Multi-chain wallet infrastructure (BTC, ETH, major L2s)
- [ ] Stablecoin settlement rails (USDC, USDT)
- [ ] Fiat on/off ramp at kiosk
- [ ] Crypto-to-card instant loading
- [ ] KYC/AML compliance per jurisdiction
- [ ] Liquidity pool management
- [ ] Crypto rewards program engine
- [ ] Remittance routing (stablecoin cross-border)

**International:**
- [ ] Multi-currency support
- [ ] Localization framework (i18n)
- [ ] Regional compliance modules (GDPR, PSD2, etc.)
- [ ] International card network integration
- [ ] Cross-border settlement

---

## Core Technology Decisions

| Layer | Technology | Rationale |
|---|---|---|
| Frontend (Web) | React + Next.js + Tailwind | SSR, SEO, rapid iteration |
| Frontend (Mobile) | React Native + Expo | Code sharing, OTA updates |
| Kiosk Firmware | Rust + embedded Linux | Safety, performance, reliability |
| API | Node.js (Fastify) or Go | High throughput, low latency |
| Database | PostgreSQL + TimescaleDB | ACID compliance + time-series analytics |
| Cache | Redis Cluster | Session management, rate limiting |
| Search | Elasticsearch | Gift card + badge search |
| Queue | RabbitMQ / SQS | Print jobs, notifications, async processing |
| Storage | S3 / Cloudflare R2 | Card designs, documents, media |
| AI/ML | Python (PyTorch) | Design generation, fraud detection |
| Auth | Custom JWT + Auth0 backup | Biometric + traditional auth |
| Payments | Stripe + card network APIs | Subscriptions + card-level transactions |
| Crypto | Fireblocks or self-hosted | Institutional-grade custody |
| Infra | AWS (primary) + Cloudflare (edge) | Global scale, edge caching |
| CI/CD | GitHub Actions | Automated testing + deployment |
| Monitoring | Datadog + PagerDuty | Full-stack observability |

---

## Security Requirements

- **PCI-DSS Level 1** — Required for card issuance and payment processing
- **SOC 2 Type II** — Required for enterprise B2B clients
- **BIPA/CCPA** — Biometric data handling compliance
- **FinCEN MSB** — Money services business registration (crypto)
- **State MTLs** — Money transmitter licenses (phased state-by-state)
- **HSM** — Hardware security modules for cryptographic key management
- **Zero Trust** — Network segmentation, mutual TLS, principle of least privilege

---

## Build Priority Matrix

| Priority | Component | Revenue Impact | Complexity |
|---|---|---|---|
| P0 | Card issuance service | Enables all card revenue | High |
| P0 | Kiosk firmware | Physical presence requirement | Very High |
| P0 | Mobile app (core) | User acquisition channel | Medium |
| P0 | PCI-DSS compliance | Legal requirement | High |
| P1 | Subscription billing | 43% of Y5 revenue | Medium |
| P1 | B2B admin portal | 8% of Y5 revenue | Medium |
| P1 | Gift card marketplace | 9% of Y5 revenue | Medium |
| P2 | Ad platform | 17% of Y5 revenue | High |
| P2 | Bank licensing (KaaS) | 4% of Y5 revenue | Medium |
| P2 | Badge/ID issuance | 2% of Y5 revenue | Low |
| P3 | Crypto engine | 10% of Y5 revenue | Very High |
| P3 | International infra | Scale multiplier | High |

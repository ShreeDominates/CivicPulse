# 🛡️ CivicPulse — Zero-Touch Citizen Services

> **Sarkari Kaam, Ab 3 Second Mein**
> Government work, now in 3 seconds.

**Built by Team UrbanIQ for Smart India Hackathon 2026**
**Problem Statement: SIH26129 — Government of Maharashtra**
*"System Integration and Interoperability Among Government Digital Platforms"*

---

## What is CivicPulse?

CivicPulse is an **intelligent orchestration layer** that connects fragmented Indian government digital systems. Instead of citizens visiting 4+ portals and uploading the same documents 8+ times, CivicPulse fetches data directly from government APIs, verifies eligibility automatically, and delivers instant approval — **zero document uploads**.

### The Problem

| Before CivicPulse | After CivicPulse |
|---|---|
| Student visits 4 portals | Single login once |
| Uploads 8 PDF documents | Zero uploads — API fetch |
| Wait 21 days for manual approval | 3-second automated decision |
| Same data entered repeatedly | Data fetched once, shared everywhere |
| No cross-department verification | Real-time government API verification |

### The Flagship Demo: Zero-Touch Scholarship

A student applies for a Higher Education Scholarship. CivicPulse automatically:

1. 📊 **Fetches income data** from Income Tax Dept via API Setu (PAN-linked)
2. 📝 **Fetches 12th board marks** from CBSE via DigiLocker API
3. 🏦 **Validates bank account** via Razorpay Fund Account Validation
4. 📍 **Normalizes address** to standard LGD district codes
5. ✅ **Evaluates eligibility** in under 3 seconds — instant approved/rejected decision

**NO manual document upload exists anywhere in this flow.**

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Citizen Portal (CivicPulse UI)             │
│  Next.js 14 + Tailwind + shadcn/ui                  │
├─────────────────────────────────────────────────────┤
│  Layer 2: Authentication (MeriPehchan / NextAuth)    │
│  Google OAuth + Aadhaar OTP mock                     │
├─────────────────────────────────────────────────────┤
│  Layer 3: Consent Gate (DPDP Act 2023)               │
│  Every cross-dept fetch requires explicit consent    │
├─────────────────────────────────────────────────────┤
│  Layer 4: CivicPulse Orchestrator API                │
│  Next.js API Routes + Zod validation                 │
├─────────────────────────────────────────────────────┤
│  Layer 5: Government APIs                            │
│  API Setu · DigiLocker · LGD · PFMS · Razorpay       │
├─────────────────────────────────────────────────────┤
│  Layer 6: Authoritative Registers                    │
│  Revenue · CBSE · Civil Registration · Parivahan     │
└─────────────────────────────────────────────────────┘
```

### Integrated Government APIs

| API | Organization | Purpose | Status |
|-----|-------------|---------|--------|
| **API Setu** | MeitY / iSPIRT | Income verification, CBSE results | ✅ Mock (sandbox ready) |
| **DigiLocker** | MeitY | Digitally signed documents | ✅ Mock (OAuth2 ready) |
| **LGD** | Ministry of Panchayati Raj | District code normalization | ✅ Mock (CSV seed ready) |
| **PFMS** | Ministry of Finance | Disbursement statistics | ✅ Mock (API ready) |
| **Razorpay** | NPCI | Bank account validation | ✅ Mock (sandbox ready) |
| **Bhashini** | MeitY | Hindi/regional translation | 🔄 Planned |
| **Aadhaar / MeriPehchan** | UIDAI | Identity verification | ✅ Mock (OTP flow ready) |

> **Note:** CivicPulse implements a decoupled Government Data Gateway architecture. For demonstration and sandbox testing, local high-fidelity simulators model documented government provider behavior (CBDT/ITR, CBSE/DigiLocker, IMPS Penny-Drop, State Revenue, and LGD). Production connectivity requires authorized departmental gateway onboarding and PKI credentials.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router, TypeScript) |
| **Styling** | Tailwind CSS + shadcn/ui components |
| **State** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **i18n** | i18next (English + Hindi) |
| **Backend** | Next.js 14 API Routes |
| **Auth** | NextAuth.js v5 (JWT sessions) |
| **Database** | SQLite (local) → PostgreSQL/Neon (production) |
| **ORM** | Prisma |
| **Cache** | Upstash Redis (production) |
| **Validation** | Zod on every API route |
| **Deployment** | Vercel + Neon + Upstash |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the project
cd civicpulse-next

# Install dependencies
npm install --ignore-scripts

# Set up environment
cp .env.example .env.local

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed LGD district data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Login

On the login page, credentials are pre-filled:
- **Full Name:** Aryan Mehta
- **Aadhaar:** 123456789012
- **OTP:** 123456

Click **"Sign In via MeriPehchan"** to enter the dashboard.

---

## Pages

| Route | Description | Auth Required |
|-------|------------|---------------|
| `/` | Landing page with hero, stats, services grid | No |
| `/about` | Problem vs Solution, architecture diagram | No |
| `/login` | MeriPehchan login (Aadhaar OTP + Google) | No |
| `/dashboard` | Citizen dashboard with applications, charts | Yes |
| `/services/scholarship` | **FLAGSHIP** — 4-step zero-touch scholarship wizard | Yes |
| `/services/birth-registration` | Auto-apply to 4 departments on birth | Yes |
| `/services/business` | MSME registration flow | Yes |
| `/admin/dashboard` | Government officer view with analytics | Yes (ADMIN) |

---

## API Routes

### Authentication
```
POST /api/auth/[...nextauth]    — NextAuth.js handler
```

### Consent (DPDP Act 2023)
```
POST   /api/consent/grant       — Create consent record, return JWT
DELETE /api/consent/revoke/[id] — Revoke active consent
```

### Government API Proxies (server-side only — API keys never reach browser)
```
POST /api/gov/fetch-income    — API Setu ITR verification
POST /api/gov/fetch-marks     — DigiLocker CBSE marksheet
POST /api/gov/validate-bank   — Razorpay fund account validation
GET  /api/gov/lgd-lookup      — LGD district code lookup
```

### Applications
```
POST /api/applications/scholarship  — Core orchestrator (fetches, evaluates, saves)
GET  /api/applications              — List citizen's own applications
GET  /api/applications/[id]         — Single application details
```

### Admin (role: ADMIN only)
```
GET   /api/admin/applications       — Paginated list across all users
PATCH /api/admin/applications/[id]  — Manual status override
GET   /api/admin/api-health         — API response time monitoring
```

### Statistics (cached, TTL: 3600s)
```
GET /api/stats/disbursements   — Data.gov.in PFMS data
GET /api/stats/district-map    — District application counts + LGD
```

### Mock Government APIs (USE_MOCK_APIS=true)
```
POST /api/mock/gov/fetch-income    — Mock income verification
POST /api/mock/gov/fetch-marks     — Mock CBSE result
POST /api/mock/gov/validate-bank   — Mock bank validation
GET  /api/mock/gov/lgd-lookup      — Mock LGD lookup
```

---

## Database Schema

```
User           — Citizens with Aadhaar hash, name, role
Application    — Scholarship/service applications with eligibility data
ConsentLog     — DPDP Act 2023 consent records with expiry
AuditLog       — Full audit trail of all API access
LgdDistrict    — Local Government Directory codes for address normalization
```

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Aadhaar Privacy** | SHA-256 hash on receipt, never stored raw |
| **Consent Tracking** | DPDP Act 2023 compliant, with expiry and revocation |
| **Rate Limiting** | 10 req/min per IP on government API routes |
| **Input Validation** | Zod schemas on every API route |
| **Auth Guard** | NextAuth session validation on protected routes |
| **Consent Gate** | Every /api/gov/* call requires active consent |
| **Audit Trail** | Full logging of who accessed what data when |
| **Environment Variables** | No hardcoded secrets, .env for all keys |
| **API Key Isolation** | Government API keys never reach the browser |

---

## Environment Variables

```env
# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database
DATABASE_URL=file:./dev.db

# Mock Mode (true for development, false for production)
USE_MOCK_APIS=true

# Government APIs (only needed when USE_MOCK_APIS=false)
APISETU_API_KEY=
DIGILOCKER_CLIENT_ID=
DIGILOCKER_CLIENT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
DATA_GOV_IN_API_KEY=

# Cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Security
AADHAAR_SALT=your-random-salt
CIVICPULSE_API_SECRET=your-api-secret

# Translation
BHASHINI_USER_ID=
BHASHINI_API_KEY=
```

---

## Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to [vercel.com/new](https://vercel.com/new)
3. Add [Neon Postgres](https://vercel.com/integrations/neon) (auto-sets DATABASE_URL)
4. Add [Upstash Redis](https://vercel.com/integrations/upstash) (auto-sets Redis vars)
5. Add all environment variables in Vercel Settings
6. Deploy: `vercel --prod`
7. Set `USE_MOCK_APIS=false` for production

### Option 2: Local Demo (Offline)

The app runs fully offline with mock APIs:
```bash
cd civicpulse-next
npm install --ignore-scripts
npx prisma generate && npx prisma db push
npx tsx prisma/seed.ts
npm run dev
# Open http://localhost:3000
```

---

## SIH Judge Demo Script (3 minutes)

### 1. Opening (30 seconds)
> "Judges, today we present CivicPulse — a Zero-Touch citizen service portal.
> The problem we solve: SIH26129 — fragmented government digital platforms.
> A student today visits 4 portals, uploads 8 PDFs, waits 21 days.
> With CivicPulse: zero uploads, 3 seconds, instant decision."

### 2. Live Demo (90 seconds)
1. **Open landing page** → Show the hero, stats, services grid
2. **Click Login** → Pre-filled Aadhaar OTP flow → "Identity verified via MeriPehchan"
3. **Click Scholarship** → Show Step 1: pre-filled identity, consent banner
   > "Under DPDP Act 2023, the citizen gives explicit consent"
4. **Check consent, click Authorize** → Step 2: live data fetching
   > "Watch — CivicPulse is now fetching from Income Tax Dept, CBSE, Revenue Portal, LGD, and Razorpay — simultaneously"
5. **All 5 tasks verified** → Step 3: eligibility decision
   > "All criteria checked automatically. Income: ₹1,60,000 — PASS. Marks: 87.4% — PASS. Category: OBC — PASS. Bank: Verified — PASS."
6. **APPLICATION APPROVED** → Confetti animation
   > "₹48,000 scholarship approved. Will be disbursed to Aadhaar-linked bank account within 24 hours via PFMS."

### 3. Architecture Explanation (45 seconds)
1. **Navigate to About** → Show architecture layers
2. **Show API badges** → "We integrate with API Setu, DigiLocker, LGD, PFMS, Razorpay — real Indian government APIs"
3. **Key differentiator** > "This is NOT an API gateway. It's an intelligence layer. We normalize data from different schemas, verify eligibility in real-time, and maintain a full DPDP-compliant audit trail."

### 4. Closing (15 seconds)
> "CivicPulse proves that India's fragmented government systems don't need replacement — they need connection. One login, zero uploads, instant decisions. Built for 1.4 billion citizens."

---

## Judge Q&A Preparation

**Q: Why is this different from an API gateway?**
> "An API gateway routes requests. CivicPulse normalizes heterogeneous schemas from different departments, creates a unified citizen view, runs eligibility logic, and maintains DPDP-compliant consent. It's an intelligence layer, not just routing."

**Q: Why is AI needed?**
> "CivicPulse uses AI for: (1) Semantic matching of district names across departments (Pune vs पुणे), (2) Duplicate detection across systems, (3) Anomaly detection in application patterns, (4) Priority scoring for urgent cases."

**Q: Why not replace existing government systems?**
> "Replacing legacy systems costs crores and takes years. CivicPulse sits on top — connecting them without modification. It's the plug, not the machine."

**Q: How do you prevent duplicate records?**
> "LGD codes normalize all geographic data. Aadhaar hashing deduplicates citizens. Cross-referencing application IDs across systems catches duplicates."

**Q: How do you handle privacy?**
> "Aadhaar numbers are SHA-256 hashed on receipt — never stored raw. Every data fetch requires explicit DPDP Act 2023 consent with expiry. Full audit trail of who accessed what data when. Citizens can revoke consent at any time."

**Q: What is actually implemented vs proposed?**
> "The full scholarship flow is end-to-end functional through the CivicPulse Government Data Gateway. It features high-fidelity local simulations based on authoritative, documented provider specifications (API Setu ITR, DigiLocker/CBSE academic records, IMPS penny-drop, and LGD). The adapter contracts, consent architecture, SHA-256 audit logging, and rules engine are fully implemented, and clearly separate simulated environments from live government credentials."

---

## Project Structure

```
civicpulse-next/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Landing page
│   │   ├── about/page.tsx              # About page
│   │   └── login/page.tsx             # Login page
│   ├── (protected)/
│   │   ├── layout.tsx                  # Auth guard layout
│   │   ├── dashboard/page.tsx          # Citizen dashboard
│   │   ├── services/
│   │   │   ├── scholarship/page.tsx    # FLAGSHIP: Zero-touch wizard
│   │   │   ├── birth-registration/page.tsx
│   │   │   └── business/page.tsx
│   │   └── admin/dashboard/page.tsx    # Government officer view
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── consent/grant/route.ts
│   │   ├── consent/revoke/[id]/route.ts
│   │   ├── gov/                        # Government API proxies
│   │   │   ├── fetch-income/route.ts
│   │   │   ├── fetch-marks/route.ts
│   │   │   ├── validate-bank/route.ts
│   │   │   └── lgd-lookup/route.ts
│   │   ├── mock/gov/                   # Mock government APIs
│   │   ├── applications/
│   │   │   ├── scholarship/route.ts    # Core orchestrator
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── admin/
│   │   │   ├── applications/route.ts
│   │   │   ├── applications/[id]/route.ts
│   │   │   └── api-health/route.ts
│   │   └── stats/
│   │       ├── disbursements/route.ts
│   │       └── district-map/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn/ui primitives
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Providers.tsx                   # SessionProvider wrapper
│   ├── ConsentBanner.tsx               # DPDP Act 2023 consent
│   ├── DataFetchProgress.tsx           # Animated data fetch steps
│   ├── EligibilityCard.tsx             # Criteria pass/fail display
│   ├── GovernmentAPIBadge.tsx          # API verification pill
│   ├── AuditTrail.tsx                  # Data access log viewer
│   └── LanguageToggle.tsx              # EN/HI switcher
├── lib/
│   ├── auth.ts                         # NextAuth config
│   ├── prisma.ts                       # Prisma client singleton
│   ├── redis.ts                        # Upstash Redis client
│   ├── ratelimit.ts                    # Rate limiting config
│   ├── store.ts                        # Zustand wizard state
│   ├── i18n.ts                         # i18next configuration
│   ├── govapi/                         # Government API clients
│   │   ├── apisetu.ts
│   │   ├── digilocker.ts
│   │   ├── razorpay.ts
│   │   └── datagov.ts
│   ├── eligibility/
│   │   └── scholarship.ts              # Business rules engine
│   └── middleware/
│       ├── withAuth.ts                 # Auth guard
│       └── withConsent.ts              # DPDP consent gate
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── seed.ts                         # LGD district seeder
├── public/locales/
│   ├── en/common.json                  # English translations
│   └── hi/common.json                  # Hindi translations
├── middleware.ts                        # CORS + route protection
├── vercel.json                         # Vercel deployment config
├── .env.example                        # Environment variable template
└── package.json
```

---

## License

MIT License — Built for Smart India Hackathon 2026

**Team UrbanIQ** | Government of Maharashtra | Problem Statement SIH26129

# UrbanMind AI — Chennai Municipal Digital Twin & Decision Ops

**Global AI Builder's Challenge (Solo Hackathon Project)**  
*Autonomous Civic Infrastructure Triage, Multi-Agent Vision Inspection, and Predictive Air Quality Digital Twin for Greater Chennai Corporation (GCC).*

---

## 🏛️ Concept & Problem Statement

Urban municipal infrastructure issues—potholes, structural asphalt craters, overflowing solid waste bins, illegal dumping, and pressurized drinking water pipe bursts—often take days or weeks to be verified, prioritized, and dispatched in high-density metropolitan cities like Chennai.

**UrbanMind AI** bridges citizen reporting with automated, multi-agent AI verification and an authority-in-the-loop digital twin:
1. **Citizen Submission:** Upload an on-ground photograph in one of Chennai's 6 municipal zones (Adyar, T. Nagar, Velachery, Anna Nagar, Tondiarpet, Guindy).
2. **Gatekeeper Agent:** Screens submissions to filter out selfies, domestic clutter, and non-infrastructure photos.
3. **Parallel Specialist Agents:** Three vision specialists run concurrently:
   - **Road Agent:** Inspects potholes, cracks, and structural asphalt fatigue.
   - **Waste Agent:** Inspects garbage dumps, overflowing municipal bins, and single-use plastic blockages.
   - **Water Agent:** Inspects pressurized waterline leaks, pipe fractures, and drainage waterlogging.
4. **Decision Agent & Multi-Factor Priority Formula:** Synthesizes findings, assigns the dominant hazard category, calculates model confidence, and executes the official priority scoring formula:
   $$\text{Priority} = \left(0.5 \times \text{Severity}_{\text{norm}} + 0.2 \times \text{Confidence} + 0.2 \times \text{Density}_{\text{norm}} + 0.1 \times \text{OpenIssues}_{\text{norm}}\right) \times 100$$
5. **Geospatial Digital Twin (`/twin`):** Interactive Leaflet + OpenStreetMap twin mapping Chennai's zones with a **Current vs Predicted toggle** that dynamically switches between infrastructure load and predictive 24-hour Air Quality Index (AQI) risks.
6. **Human Authority in the Loop (`/review`):** Final decision rights strictly remain with verified city officials who approve, edit parameters, or reject reports with audit-trailed rationale.

---

## 🛠️ Stack & Architecture

- **Framework:** Next.js 14+ (App Router, TypeScript strict mode), Tailwind CSS
- **Map:** Leaflet + OpenStreetMap (no proprietary API key required)
- **Database:** Dual-mode architecture:
  - Neon / Vercel Postgres via `@neondatabase/serverless` when `DATABASE_URL` is set.
  - Automatic in-memory fallback pre-seeded with realistic Chennai demo accounts & zone issues when `DATABASE_URL` is absent.
- **AI Vision:** Google Gemini API (`@google/generative-ai`), vision model configured via `GEMINI_MODEL`, abstracted behind a swappable `lib/ai.ts` wrapper with schema-validated retries and fallback analyzers.
- **Validation:** Strict `zod` schema validation on every API route input and agent output.
- **Auth & Session Security:** Custom lightweight auth:
  - `bcryptjs` (cost 10) password hashing
  - Signed HS256 JWT tokens via `jose` stored in an `httpOnly`, `secure`, `sameSite=lax` cookie (`um_session`) with 7-day expiry.
  - In-memory rate limiting (5 req/min/IP).
  - Server-side role verification (`citizen` vs `authority`).

---

## 🔑 Demo Accounts & Credentials

The application automatically seeds idempotent demo accounts labeled **"Demo account"** in the UI:

| Role | Email | Password | Allowed Pages |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@demo.com` | `Demo1234` | `/` (Report), `/twin` (Read-only), `/my-reports` |
| **City Official (GCC)** | `official@demo.com` | `Demo1234` | All pages + `/review` (Dispatch) + `/evaluation` |

> **Official Signup Invite Code:** To create a new City Official account on `/signup`, select "I am a city official" and enter the invite code: `CHENNAI_GCC_2026`.

---

## 🚀 Getting Started Locally

### 1. Clone & Install
```bash
git clone <repo-url>
cd "UrbanMind AI"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key | Optional (uses smart demo fallback if omitted) |
| `GEMINI_MODEL` | Vision model identifier | `gemini-1.5-flash` |
| `DATABASE_URL` | Neon Postgres connection string | Optional (falls back to seeded in-memory store) |
| `AUTH_SECRET` | 32+ character JWT signing key | Included default in `.env.local` |
| `AUTHORITY_INVITE_CODE` | City Official signup invite code | `CHENNAI_GCC_2026` |

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production & Verify
```bash
npm run build
npm run start
```

---

## 🧪 Automated Test Suite

A comprehensive end-to-end verification suite is included in `scratch/test-suite.mjs`:
```bash
node scratch/test-suite.mjs
```
**Test Coverage (28/28 Passing):**
- Unauthenticated access rejection (401)
- Demo account login and role verification
- JWT `um_session` cookie issuance & password hash omission
- Multi-agent pipeline execution (Gatekeeper, Road, Waste, Water, Decision)
- Priority formula computation and component weighting
- Citizen submission & report persistence
- Authority permission gates: citizens forbidden (403) from review actions
- Authority approval, parameter editing, and decision logging
- Geospatial digital twin telemetry & predictive 24h air quality forecasts
- Model evaluation benchmark and 14-day backtest data loading
- Authority invite code server-side enforcement

---

## 🌐 Deploy to Vercel

UrbanMind AI is fully serverless-friendly with zero persistent filesystem dependencies:
1. Push this repository to GitHub or GitLab.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Set environment variables:
   - `AUTH_SECRET` = `super_secret_urbanmind_jwt_signing_key_at_least_32_characters_long`
   - `AUTHORITY_INVITE_CODE` = `CHENNAI_GCC_2026`
   - `GEMINI_API_KEY` = `your_gemini_api_key` (Optional: smart demo fallback activates if omitted)
   - `DATABASE_URL` = *(Optional: Neon Postgres connection string; in-memory fallback is active by default)*
4. Click **Deploy**.

---

## 🛡️ Known Limitations & Safety Principles

1. **Human-in-the-Loop Failsafe:** Whenever AI confidence is `< 0.60` or severity is `Level 4` or `Level 5`, the system sets `needs_human_review = true`. No automated field dispatches occur without human sign-off.
2. **Night-time Low-Light Vision:** Photographic samples under inadequate street lighting (<5 lux) exhibit lower confidence in asphalt depth detection.
3. **Serverless In-Memory Rate Limiting:** The default 5 req/min/IP rate limiter is stored in-memory; production deployments with multiple serverless lambdas can attach Upstash Redis.
4. **Synthetic Data Transparency:** In accordance with competition rules, all pre-seeded demonstration data and fallback outputs are clearly labeled with the **"Demo data"** badge in the user interface.

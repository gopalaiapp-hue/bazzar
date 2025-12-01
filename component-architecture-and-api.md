# BazaarBudget — Component Architecture & API Contracts

**Version:** 1.0
**Date:** 29 Nov 2025
**Owner:** Nitesh Jha / BazaarBudget Eng

---

## Table of Contents

1. Executive summary
2. Frontend component architecture (Monorepo: apps/mobile/src + packages/ui)
3. Component design system & tokens
4. Screen-level architecture & flows (Onboarding → Home → We → Pockets → Entry)
5. Reusable component catalogue (Atoms → Molecules → Organisms → Templates)
6. State management, side effects and data layer
7. Cross-cutting frontend services
8. Backend services & microservices map (apps/api/nest)
9. Database schema (high level)
10. Full API contracts (Markdown) — Auth, User, Onboarding, AA, Transactions, Pockets, Family, Notifications, Admin
11. Event / pub-sub & webhooks
12. CI/CD considerations & contracts
13. Appendix: Error codes, conventions, auth headers

---

# 1. Executive summary

This document defines the component architecture for the mobile app (Expo + Tamagui) and the full API contracts to be used by frontend and backend teams. The goal is to provide a single source-of-truth for engineers to implement UI components, state flows, and server endpoints with precise request/response shapes.

Assumptions:

* Monorepo with apps/mobile (Expo) and apps/api (NestJS)
* Shared packages: packages/ui, packages/types, packages/hooks
* Auth: Firebase (JWT)|Server issues session token (access_token)
* DB: Postgres + Prisma
* AA: Setu Accounts Aggregator

---

# 2. Frontend component architecture (high level)

**Directory conventions (suggested)**

```
apps/mobile/src/
  components/      # atoms/molecules/organisms
  screens/         # OnboardingScreen1..6, Home, We, Pockets, TransactionDetail
  hooks/           # useAuth, useFetch, useAA, useVoiceEntry
  services/        # api client, analytics, notifications
  navigation/      # stack, bottom-tabs
  theme/           # tokens, tamagui config
  assets/           
packages/ui/        # shared design system components
packages/types/     # shared TypeScript interfaces (API models)
```

**Component ownership**

* `packages/ui/*` — primary source of truth for UI components (GlassButton, Card, Typography, IconButton)
* `apps/mobile/src/components/*` — app-specific wrappers and compositions
* Designers provide Figma tokens and exported lottie files to `assets/`.

---

# 3. Component design system & tokens

Design tokens (source: packages/ui/tokens.ts)

* Colors: charcoal (#0F1720), bg (#0B0C0D), kesari (#FF6B1A), glass overlay rgba(255,255,255,0.06)
* Radii: 4, 8, 12, 24
* Blur: 16, 24 (glass standard 24)
* Typography: Inter/Hind 14/16/18/24 weight mapping
* Motion: durations: micro 120ms, short 240ms, medium 360ms

Token usage enforced in Tamagui theme.

---

# 4. Screen-level architecture & flows (priority for early sprints)

**Onboarding Flow (screens)**

* OnboardingScreen1: phone input + OTP input (auth handled by Firebase)
* OnboardingScreen2: `Aapki family mein kitne log hain?` (family size selection)
* OnboardingScreen3: income range
* OnboardingScreen4: primary spending method
* OnboardingScreen5: privacy & AA consent CTA
* OnboardingScreen6: enable notifications

**Navigation**

* Stack: AuthStack (onboarding) → MainTab
* MainTab: Home, We, Pockets, Add, Insights

---

# 5. Reusable component catalogue

## Atoms

* `Text` (Typography)
* `Icon` (lucide-react wrapper)
* `Touchable` (gesture wrapper)
* `GlassButton` (glass look + ripple) — **file: packages/ui/GlassButton.tsx**
* `Badge`, `Avatar`, `Input`, `OTPInput`

## Molecules

* `FormRow` (label + input)
* `FamilyOptionCard` (illustration + title + subtitle + selectable)
* `PocketCard` (pocket summary)

## Organisms

* `OnboardingFamilySelector` (grid of FamilyOptionCard with animation)
* `TransactionList` (sectioned by date)
* `AAConsentCard` (start AA flow)

## Templates / Screens

* OnboardingScreen2.tsx
* HomeScreen.tsx
* WeScreen.tsx

---

# 6. State management, side effects and data layer

**State choices:**

* Global UI state: Zustand (lightweight) or Redux Toolkit (if complex)
* Server data: react-query (TanStack Query) for caching, automatic refetch, optimistic updates

**Suggested patterns:**

* `useAuth()` hook responsible for tokens and user profile
* `useAA()` hook manages AA consent -> polls status
* `useTransactions(params)` -> react-query endpoint

**Offline & queueing**

* Local cache in AsyncStorage + queue for manual cash entries to be sent when online

---

# 7. Cross-cutting frontend services

* `apiClient` (axios wrapper): attaches `Authorization: Bearer <access_token>` header; handles 401 → refresh token flow
* `analytics` (amplitude/mixpanel wrapper)
* `notificationService` (expo-notifications wrapper)
* `voiceService` (expo-speech + speech-to-text adaptor)

---

# 8. Backend services & microservices map

Single NestJS app initially with modular layout; later split into microservices.

**Modules:**

* `auth` (firebase verification + session tokens)
* `users` (profiles)
* `onboarding` (onboarding answers)
* `aa` (accounts aggregator integration)
* `transactions` (ingestion, normalization)
* `pockets` (budget engine)
* `family` (household model)
* `notifications` (push, SMS)
* `admin` (internal tools)
* `jobs` (workers: AA sync, transaction normalization)

**Inter-service comms:**

* Cron / queues via Redis + BullMQ
* Events via Postgres notify or Kafka (later)

---

# 9. Database schema (high level)

Key tables (Prisma models simplified):

* `users` (id, phone, name, email?, created_at)
* `profiles` (user_id, language, default_currency, timezone)
* `households` (id, name, owner_id, created_at)
* `household_members` (id, household_id, user_id, role)
* `onboarding_answers` (user_id, key, value)
* `accounts` (id, user_id, provider, last4, account_type, aa_consent_id, linked_at)
* `transactions` (id, account_id, user_id, household_id?, amount, currency, category, merchant, txn_date, imported_via, raw_payload, normalized_at)
* `pockets` (id, household_id, name, limit, current_balance, type, created_at)
* `pocket_transactions` (id, pocket_id, transaction_id, amount)
* `notifications` (id, user_id, type, delivered, payload)

Indices: txn_date, user_id, household_id, account_id

---

# 10. FULL API CONTRACTS (Markdown)

All endpoints are versioned under `/v1`.
Common headers:

* `Authorization: Bearer <server_access_token>`
* `x-client-id: <expo-app-id>`
* `x-client-version: <1.0.0>`

Errors: standard envelope `{ code: string, message: string, details?: any }`

---

## 10.1 AUTH

### POST /v1/auth/firebase-login

**Description:** Exchange Firebase ID token for server session token (access token + refresh)

**Request body** (application/json):

```json
{ "idToken": "<firebase-id-token>" }
```

**Response 200:**

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<opaque>",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "phone": "+919876543210",
    "name": null,
    "profile_complete": false
  }
}
```

**Errors:** 401 invalid token

---

### POST /v1/auth/refresh

**Request:** `{ "refresh_token": "<opaque>" }`
**Response:** new access token + expiry

---

## 10.2 USERS

### GET /v1/users/me

**Headers:** Authorization

**Response 200:**

```json
{
  "id":"uuid",
  "phone":"+919876543210",
  "name":"Nitesh",
  "language":"hi",
  "household_id":"uuid|null",
  "onboarding_complete": true
}
```

---

### PATCH /v1/users/me

**Body:** partial profile fields

```json
{ "name":"Nitesh", "language":"hi" }
```

**Response:** updated user

---

## 10.3 ONBOARDING

### POST /v1/onboarding/answers

**Description:** Save a user's onboarding answer. Called after each screen.

**Request body:**

```json
{
  "user_id":"uuid",
  "answers": [
    {"key":"family_size", "value":"sirf_main"},
    {"key":"income_range", "value":"25k-50k"}
  ]
}
```

**Response 200:** `{ "ok": true }
`

---

### GET /v1/onboarding/status

**Response:**

```json
{ "screen_completed": [1,2] }
```

---

## 10.4 HOUSEHOLD / FAMILY

### POST /v1/households

**Create household** (owner creates)

**Body:**

```json
{ "name":"Jha Family", "owner_id":"uuid" }
```

**Response:** household object

---

### POST /v1/households/:id/members

**Add member (invite by phone)**

**Body:** `{ "phone": "+919876543211", "role":"member" }`

**Response:** `{ "invite_id":"uuid", "status":"pending" }`

---

### GET /v1/households/:id

**Response:** household detail with members

---

## 10.5 ACCOUNTS AGGREGATOR (AA)

### POST /v1/aa/consent

**Description:** Start Setu AA consent flow (server returns `consent_url` or `consent_token`)

**Request:** `{ "user_id":"uuid", "return_url":"bazaarbudget://aa-callback" }
`

**Response:**

```json
{ "consent_url":"https://setu.co/...", "consent_id":"<id>" }
```

---

### GET /v1/aa/consent/:consentId/status

**Response:**

```json
{ "consent_id":"..","status":"CREATED|SUCCESS|FAILED|EXPIRED","linked_accounts":[ .. ] }
```

---

### POST /v1/aa/accounts/:accountId/transactions/fetch

**Trigger fetching transactions for an account (async)**

**Request:** `{ "from":"2025-01-01","to":"2025-11-29" }`

**Response:** `{ "job_id":"uuid" }`

---

## 10.6 TRANSACTIONS

### GET /v1/transactions

**Query params:** `?user_id=&household_id=&from=&to=&cursor=&limit=`

**Response:** paginated list

```json
{
  "data": [
    {
      "id":"txn_uuid",
      "user_id":"uuid",
      "household_id":"uuid|null",
      "account_id":"acc_uuid",
      "amount":45000,
      "currency":"INR",
      "category":"petrol",
      "merchant":"HP Petrol Pump",
      "txn_date":"2025-11-29T18:12:00Z",
      "normalized": true
    }
  ],
  "cursor":"next-cursor"
}
```

---

### POST /v1/transactions

**Create manual transaction (cash or voice-confirmed)**

**Body:**

```json
{
  "user_id":"uuid",
  "household_id":"uuid|null",
  "amount":450,
  "currency":"INR",
  "category":"petrol",
  "merchant":"",
  "txn_date":"2025-11-29T18:12:00Z",
  "source":"manual|voice|aa|sms"
}
```

**Response:** 201 created transaction object

---

### PATCH /v1/transactions/:id/categorize

**Manual recategorization**

**Body:** `{ "category":"grocery" }
`

**Response:** updated transaction

---

## 10.7 POCKETS (Budget Engine)

### POST /v1/pockets

**Create pocket**

**Body:**

```json
{
  "household_id":"uuid",
  "name":"Petrol",
  "limit":5000,
  "period":"monthly"
}
```

**Response:** pocket object

---

### GET /v1/pockets?household_id=uuid

**Response:** list of pockets with current spend / balance

---

### POST /v1/pockets/:id/allocate

**Allocate a transaction to pocket** `{ "transaction_id":"uuid" }`

**Response:** updated pocket & pocket_transaction entry

---

## 10.8 NOTIFICATIONS

### GET /v1/notifications

**Response:** list

### POST /v1/notifications/push

**Admin push to user(s)** — internal only

**Body:** `{ "user_ids":[], "title":"...","body":"...","payload":{}}`

---

## 10.9 ADMIN

### GET /v1/admin/users?query

**Returns user list with AA status, txn counts

### POST /v1/admin/transactions/reprocess

**Reprocess a transaction (useful for normalization bug)

---

# 11. Events / Pub-Sub & Webhooks

**Events emitted:**

* `txn.imported` `{ transaction_id, source }`
* `aa.consent.success` `{ consent_id, user_id }`
* `pocket.alert` `{ pocket_id, household_id, level }`
* `household.member.invited` `{ invite_id }`

**Delivery:** Redis-Bull workers subscribe; optionally webhook to 3rd parties (secure HMAC)

---

# 12. CI/CD considerations & contracts

* Branch naming: `feat/*`, `fix/*`, `chore/*`
* Protected `main` — PR required with `dev/your-name` branch
* Preview builds via Expo EAS for mobile branches
* Backend preview deployments in Railway per PR

---

# 13. Appendix: Error codes, conventions, auth

**Common error envelope**

```json
{ "error": { "code":"ERR_INVALID_PARAMS", "message":"Invalid input","details":{...} } }
```

**Auth header**
`Authorization: Bearer <access_token>` — tokens issued by server after Firebase verification

**Date format:** ISO-8601 UTC (server), clients display localized timezone (Asia/Kolkata)

---

# 14. Notes & Implementation guidance (quick)

* Keep API responses light; use cursor-based pagination for transactions
* Use event-driven architecture for heavy operations (txn normalization, AA sync)
* React-query + optimistic UI for manual txn creation
* Use semantic versioning for APIs: v1 -> v2 for breaking changes

---

# 15. Next steps (recommended)

1. Place this MD in repo root as `docs/component-architecture-and-api.md` (I created this in canvas for review)
2. Create `packages/types` models derived from API contracts (run OpenAPI -> TS generator)
3. Implement `GlassButton` in `packages/ui` and wire to OnboardingScreen2
4. QA the AA consent flow in sandbox

---

*End of document.*

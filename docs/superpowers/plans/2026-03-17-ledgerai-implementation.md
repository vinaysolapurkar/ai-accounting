# LedgerAI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete AI-powered accounting PWA with receipt scanning, conversational AI, multi-country tax support, and 6 platform integrations.

**Architecture:** Hybrid monolith (Next.js 15 + Supabase) with separate integration service. DeepSeek API for OCR and chat AI. PWA for mobile installation.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres/Auth/Storage), DeepSeek OCR 2 + Chat API, next-pwa

---

## Phase 1: Project Setup & Foundation

### Task 1: Initialize Next.js project with TypeScript, Tailwind, shadcn/ui

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/lib/utils.ts`, `components.json`

- [ ] **Step 1:** Initialize Next.js 15 with App Router, TypeScript, Tailwind, src directory
- [ ] **Step 2:** Initialize shadcn/ui with default config
- [ ] **Step 3:** Install core dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `recharts`, `next-pwa`
- [ ] **Step 4:** Configure PWA in next.config.ts
- [ ] **Step 5:** Create `.env.local` with Supabase + DeepSeek keys
- [ ] **Step 6:** Verify dev server starts
- [ ] **Step 7:** Commit

### Task 2: Supabase schema setup

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabase/client.ts` (browser client)
- Create: `src/lib/supabase/server.ts` (server client)
- Create: `src/lib/supabase/types.ts` (generated types)

- [ ] **Step 1:** Write full SQL schema (all tables from spec)
- [ ] **Step 2:** Create Supabase client helpers (browser + server)
- [ ] **Step 3:** Create TypeScript types for all tables
- [ ] **Step 4:** Commit

### Task 3: Auth system (email/password)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/middleware.ts` (auth middleware)
- Create: `src/lib/auth/actions.ts` (server actions)

- [ ] **Step 1:** Build login page with email/password form
- [ ] **Step 2:** Build signup page with country/business type selection
- [ ] **Step 3:** Create server actions for login/signup/logout
- [ ] **Step 4:** Add auth middleware to protect dashboard routes
- [ ] **Step 5:** Verify auth flow works
- [ ] **Step 6:** Commit

## Phase 2: Core Accounting Engine

### Task 4: Multi-country tax engine

**Files:**
- Create: `src/lib/tax-engine/base.ts`
- Create: `src/lib/tax-engine/india.ts`
- Create: `src/lib/tax-engine/united-states.ts`
- Create: `src/lib/tax-engine/united-kingdom.ts`
- Create: `src/lib/tax-engine/australia.ts`
- Create: `src/lib/tax-engine/new-zealand.ts`
- Create: `src/lib/tax-engine/eu/base.ts`
- Create: `src/lib/tax-engine/eu/germany.ts`
- Create: `src/lib/tax-engine/eu/france.ts`
- Create: `src/lib/tax-engine/index.ts`

- [ ] **Step 1:** Define TaxEngine interface and types
- [ ] **Step 2:** Implement India module (GST/CGST/SGST/IGST, HSN codes)
- [ ] **Step 3:** Implement US module (state sales tax rates)
- [ ] **Step 4:** Implement UK module (VAT rates)
- [ ] **Step 5:** Implement Australia + NZ modules
- [ ] **Step 6:** Implement EU base + Germany + France modules
- [ ] **Step 7:** Create factory function to get engine by country
- [ ] **Step 8:** Commit

### Task 5: Chart of Accounts templates

**Files:**
- Create: `src/lib/accounting/chart-of-accounts.ts`
- Create: `src/lib/accounting/templates/india.ts`
- Create: `src/lib/accounting/templates/us.ts`
- Create: `src/lib/accounting/templates/uk.ts`
- Create: `src/lib/accounting/templates/australia.ts`
- Create: `src/lib/accounting/templates/new-zealand.ts`
- Create: `src/lib/accounting/templates/eu.ts`

- [ ] **Step 1:** Define default COA for India (with GST accounts)
- [ ] **Step 2:** Define default COA for US, UK, AU, NZ, EU
- [ ] **Step 3:** Create function to seed COA for a new user
- [ ] **Step 4:** Commit

### Task 6: Double-entry transaction engine

**Files:**
- Create: `src/lib/accounting/transactions.ts`
- Create: `src/lib/accounting/ledger.ts`
- Create: `src/lib/accounting/reports.ts`

- [ ] **Step 1:** Create transaction functions (create, validate, list)
- [ ] **Step 2:** Create ledger functions (account balances, running totals)
- [ ] **Step 3:** Create report generators (balance sheet, P&L, trial balance, cash flow)
- [ ] **Step 4:** Commit

## Phase 3: AI Pipeline

### Task 7: DeepSeek OCR integration

**Files:**
- Create: `src/lib/ai/provider.ts` (abstraction layer)
- Create: `src/lib/ai/deepseek.ts`
- Create: `src/lib/ai/ocr.ts`
- Create: `src/app/api/ocr/route.ts`

- [ ] **Step 1:** Create AI provider abstraction interface
- [ ] **Step 2:** Implement DeepSeek client (OCR + Chat)
- [ ] **Step 3:** Build OCR pipeline: image → DeepSeek OCR 2 → structured extraction
- [ ] **Step 4:** Create API route for receipt upload + OCR
- [ ] **Step 5:** Commit

### Task 8: AI Chat engine

**Files:**
- Create: `src/lib/ai/chat.ts`
- Create: `src/lib/ai/intent-classifier.ts`
- Create: `src/lib/ai/query-builder.ts`
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1:** Build intent classifier (QUERY/ACTION/REPORT/GENERAL)
- [ ] **Step 2:** Build parameterized query builder (safe SQL from structured intents)
- [ ] **Step 3:** Build chat engine with tool/function-calling layer
- [ ] **Step 4:** Create streaming chat API route
- [ ] **Step 5:** Commit

## Phase 4: UI — Dashboard & Receipt Scanner

### Task 9: Dashboard layout & navigation

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/dashboard/overview-cards.tsx`
- Create: `src/components/dashboard/recent-transactions.tsx`
- Create: `src/components/dashboard/quick-actions.tsx`

- [ ] **Step 1:** Build responsive sidebar with navigation
- [ ] **Step 2:** Build dashboard page with overview cards
- [ ] **Step 3:** Build recent transactions list
- [ ] **Step 4:** Build quick action buttons
- [ ] **Step 5:** Commit

### Task 10: Receipt scanner UI

**Files:**
- Create: `src/app/(dashboard)/receipts/page.tsx`
- Create: `src/components/receipts/upload-zone.tsx`
- Create: `src/components/receipts/camera-capture.tsx`
- Create: `src/components/receipts/receipt-review.tsx`
- Create: `src/components/receipts/receipt-list.tsx`

- [ ] **Step 1:** Build file upload zone (drag & drop + gallery picker)
- [ ] **Step 2:** Build camera capture component (PWA camera API)
- [ ] **Step 3:** Build receipt review form (AI-extracted data, editable, 1-click confirm)
- [ ] **Step 4:** Build receipts list page
- [ ] **Step 5:** Wire up OCR API
- [ ] **Step 6:** Commit

### Task 11: AI Chat UI

**Files:**
- Create: `src/app/(dashboard)/chat/page.tsx`
- Create: `src/components/chat/chat-interface.tsx`
- Create: `src/components/chat/message-bubble.tsx`
- Create: `src/components/chat/action-confirmation.tsx`

- [ ] **Step 1:** Build chat interface with message history
- [ ] **Step 2:** Build message bubbles (user/assistant with markdown)
- [ ] **Step 3:** Build action confirmation dialogs
- [ ] **Step 4:** Wire up streaming chat API
- [ ] **Step 5:** Commit

## Phase 5: Accounting UI

### Task 12: Transactions & Ledger pages

**Files:**
- Create: `src/app/(dashboard)/transactions/page.tsx`
- Create: `src/app/(dashboard)/ledger/page.tsx`
- Create: `src/components/transactions/transaction-form.tsx`
- Create: `src/components/transactions/transaction-list.tsx`
- Create: `src/components/ledger/account-ledger.tsx`

- [ ] **Step 1:** Build transaction list with filters (date, category, status)
- [ ] **Step 2:** Build manual transaction form (double-entry)
- [ ] **Step 3:** Build ledger view (account balances, running totals)
- [ ] **Step 4:** Commit

### Task 13: Reports pages

**Files:**
- Create: `src/app/(dashboard)/reports/page.tsx`
- Create: `src/app/(dashboard)/reports/balance-sheet/page.tsx`
- Create: `src/app/(dashboard)/reports/profit-loss/page.tsx`
- Create: `src/app/(dashboard)/reports/trial-balance/page.tsx`
- Create: `src/components/reports/report-table.tsx`
- Create: `src/components/reports/report-chart.tsx`

- [ ] **Step 1:** Build reports overview page
- [ ] **Step 2:** Build balance sheet page with auto-generation
- [ ] **Step 3:** Build P&L page with date range filters
- [ ] **Step 4:** Build trial balance page
- [ ] **Step 5:** Add chart visualizations (recharts)
- [ ] **Step 6:** Add PDF/CSV export buttons
- [ ] **Step 7:** Commit

### Task 14: Invoice management

**Files:**
- Create: `src/app/(dashboard)/invoices/page.tsx`
- Create: `src/app/(dashboard)/invoices/new/page.tsx`
- Create: `src/app/(dashboard)/invoices/[id]/page.tsx`
- Create: `src/components/invoices/invoice-form.tsx`
- Create: `src/components/invoices/invoice-preview.tsx`
- Create: `src/components/invoices/invoice-list.tsx`

- [ ] **Step 1:** Build invoice list page
- [ ] **Step 2:** Build invoice creation form (client, line items, tax auto-calc)
- [ ] **Step 3:** Build invoice preview (printable/PDF)
- [ ] **Step 4:** Add mark-as-paid flow (auto-creates transaction)
- [ ] **Step 5:** Commit

### Task 15: Bank reconciliation

**Files:**
- Create: `src/app/(dashboard)/reconciliation/page.tsx`
- Create: `src/components/reconciliation/statement-upload.tsx`
- Create: `src/components/reconciliation/match-review.tsx`
- Create: `src/app/api/reconciliation/route.ts`

- [ ] **Step 1:** Build statement upload (CSV/PDF)
- [ ] **Step 2:** Build AI-powered matching logic
- [ ] **Step 3:** Build match review UI (confirm/reject matches)
- [ ] **Step 4:** Commit

## Phase 6: Landing Page & Onboarding

### Task 16: Landing page

**Files:**
- Create: `src/app/page.tsx` (override with landing page)
- Create: `src/components/landing/hero.tsx`
- Create: `src/components/landing/features.tsx`
- Create: `src/components/landing/pricing.tsx`
- Create: `src/components/landing/testimonials.tsx`
- Create: `src/components/landing/footer.tsx`
- Create: `src/components/landing/navbar.tsx`

- [ ] **Step 1:** Build navigation bar with CTA
- [ ] **Step 2:** Build hero section with product demo visual
- [ ] **Step 3:** Build features section (6 key features)
- [ ] **Step 4:** Build pricing table (4 tiers)
- [ ] **Step 5:** Build country support section
- [ ] **Step 6:** Build testimonials section
- [ ] **Step 7:** Build footer
- [ ] **Step 8:** Commit

### Task 17: Onboarding flow

**Files:**
- Create: `src/app/(auth)/onboarding/page.tsx`
- Create: `src/components/onboarding/country-select.tsx`
- Create: `src/components/onboarding/business-type-select.tsx`
- Create: `src/components/onboarding/setup-complete.tsx`

- [ ] **Step 1:** Build country selection step
- [ ] **Step 2:** Build business type selection step
- [ ] **Step 3:** Wire up COA + tax rules seeding on completion
- [ ] **Step 4:** Redirect to dashboard
- [ ] **Step 5:** Commit

## Phase 7: Export & Integration Service

### Task 18: Tally XML export

**Files:**
- Create: `src/lib/integrations/tally/xml-builder.ts`
- Create: `src/app/api/export/tally/route.ts`

- [ ] **Step 1:** Build Tally XML voucher/master/ledger generator
- [ ] **Step 2:** Create export API route
- [ ] **Step 3:** Commit

### Task 19: Integration service scaffold + CSV/PDF export

**Files:**
- Create: `src/lib/integrations/csv-export.ts`
- Create: `src/lib/integrations/pdf-export.ts`
- Create: `src/app/api/export/csv/route.ts`
- Create: `src/app/api/export/pdf/route.ts`
- Create: `src/app/(dashboard)/integrations/page.tsx`

- [ ] **Step 1:** Build CSV export for transactions/reports
- [ ] **Step 2:** Build PDF export for reports/invoices
- [ ] **Step 3:** Build integrations page UI (connect/disconnect platforms)
- [ ] **Step 4:** Commit

## Phase 8: PWA & Polish

### Task 20: PWA configuration & manifest

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/` (app icons)
- Modify: `src/app/layout.tsx` (PWA meta tags)

- [ ] **Step 1:** Create manifest.json with app metadata
- [ ] **Step 2:** Generate app icons (multiple sizes)
- [ ] **Step 3:** Add PWA meta tags to layout
- [ ] **Step 4:** Configure service worker via next-pwa
- [ ] **Step 5:** Commit

### Task 21: Settings & profile page

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`
- Create: `src/components/settings/profile-form.tsx`
- Create: `src/components/settings/billing-section.tsx`

- [ ] **Step 1:** Build profile settings page
- [ ] **Step 2:** Build billing/plan section
- [ ] **Step 3:** Add data export (GDPR) button
- [ ] **Step 4:** Commit

### Task 22: Final integration testing & production build

- [ ] **Step 1:** Run full build (`next build`)
- [ ] **Step 2:** Test all user flows end-to-end
- [ ] **Step 3:** Fix any build/runtime errors
- [ ] **Step 4:** Start production server
- [ ] **Step 5:** Final commit

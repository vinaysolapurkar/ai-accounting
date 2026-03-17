# LedgerAI — AI-Powered Accounting PWA

**Date:** 2026-03-17
**Status:** Approved
**Author:** Design session with user

---

## 1. Product Overview

LedgerAI is an AI-powered accounting PWA that lets small business owners and freelancers manage their entire bookkeeping through receipt scanning and natural language conversation. Single point of entry — snap a receipt or type a command, the AI handles the rest.

### Target Users
- Small business owners and freelancers who don't have an accountant
- Need to manage their own books across India, US, UK, EU, Australia, New Zealand

### Key Differentiator
No existing product combines receipt OCR + full double-entry accounting + multi-country compliance + conversational AI assistant + 6 platform integrations (Tally, QuickBooks, Sage, Zoho Books, Wave, SAP) in a single PWA.

---

## 2. Architecture

### Approach: Hybrid Monolith + Separate Integration Service

**Two deployable units:**

1. **Main App** (Next.js 15 on Vercel) — UI, API routes, auth, OCR, accounting engine, AI chat
2. **Integration Service** (Node.js on Vercel/Railway) — OAuth flows + data sync with 6 external accounting platforms

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│              Next.js PWA (Vercel)                │
│  ┌──────────┬───────────┬──────────┬──────────┐  │
│  │ Landing  │ Dashboard │ Chat AI  │ Reports  │  │
│  │ Page     │ & Upload  │ Console  │ & Export │  │
│  └──────────┴───────────┴──────────┴──────────┘  │
│  ┌──────────────────────────────────────────────┐ │
│  │         Next.js API Routes (Backend)         │ │
│  │  Auth · OCR · Accounting Engine · AI Chat    │ │
│  └──────────────────────────────────────────────┘ │
└──────────────┬──────────────────┬────────────────┘
               │                  │
    ┌──────────▼──────┐  ┌───────▼────────┐
    │    Supabase     │  │  DeepSeek API  │
    │ Postgres · Auth │  │  OCR + Chat AI │
    │ Storage · Edge  │  │                │
    └─────────────────┘  └────────────────┘
               │
    ┌──────────▼──────────────────┐
    │  Integration Service        │
    │  Tally · QuickBooks · Sage  │
    │  Zoho · Wave · SAP          │
    └─────────────────────────────┘
```

### Tech Stack
- **Frontend:** Next.js 15 (App Router, Server Components), Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI:** DeepSeek OCR 2 (receipt scanning), DeepSeek Chat (NL queries + actions)
- **PWA:** next-pwa (installable, offline-capable, camera access)
- **Integration Service:** Node.js + Express (separate deployment)

---

## 3. Data Model

### Core Tables

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | References auth.users.id from Supabase Auth |
| email | text | unique |
| business_name | text | |
| business_type | text | freelancer, sole_prop, llc, etc. |
| country | text | IN/US/UK/AU/NZ + EU member state codes (DE/FR/etc.) |
| currency | text | INR/USD/GBP/EUR/AUD/NZD |
| tax_id | text | GSTIN, EIN, VAT, ABN, etc. |
| plan | text | free/starter/pro/enterprise |
| fiscal_year_start | integer | Month (1-12), e.g., 4 for India (Apr-Mar), 1 for US (Jan-Dec) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### organizations (team support)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| name | text | |
| owner_id | uuid, FK → users | |
| plan | text | free/starter/pro/enterprise |
| created_at | timestamptz | |

#### organization_members
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| org_id | uuid, FK → organizations | |
| user_id | uuid, FK → users | |
| role | text | owner/admin/member/viewer |
| invited_at | timestamptz | |
| accepted_at | timestamptz | |

#### clients (contacts)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| name | text | |
| email | text | |
| tax_id | text | GSTIN, VAT, EIN, etc. |
| address | jsonb | |
| country | text | |
| currency | text | default currency for this client |
| created_at | timestamptz | |

#### accounts (Chart of Accounts)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| name | text | |
| code | text | account code |
| type | text | asset/liability/equity/revenue/expense |
| parent_id | uuid, FK (self) | hierarchical COA |
| country_template | text | which country default |
| is_system | boolean | default accounts |

#### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| date | date | |
| description | text | |
| reference_number | text | |
| source | text | receipt_scan/manual/bank_import/chat |
| status | text | draft/confirmed/reconciled |
| currency | text | |
| exchange_rate | decimal | |
| created_at | timestamptz | |

#### transaction_lines (double-entry)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| transaction_id | uuid, FK | |
| account_id | uuid, FK | |
| debit | decimal | |
| credit | decimal | |
| tax_code | text | |
| tax_amount | decimal | |
| description | text | |

#### receipts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| image_url | text | Supabase Storage |
| raw_ocr_data | jsonb | full DeepSeek response |
| extracted_vendor | text | |
| extracted_amount | decimal | |
| extracted_date | date | |
| extracted_category | text | |
| extracted_line_items | jsonb | |
| extracted_tax_info | jsonb | GST/VAT/sales tax |
| hsn_codes | jsonb | India-specific |
| transaction_id | uuid, FK | linked after confirm |
| status | text | pending/reviewed/linked |
| created_at | timestamptz | |

#### tax_rules
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| country | text | |
| tax_type | text | GST/VAT/sales_tax |
| tax_name | text | |
| rate | decimal | |
| hsn_sac_code | text | India-specific |
| state_province | text | US state / Indian state |
| effective_from | date | |
| effective_to | date | |
| is_active | boolean | |

#### invoices
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| client_id | uuid, FK → clients | |
| invoice_number | text | |
| date | date | |
| due_date | date | |
| subtotal | decimal | |
| tax_total | decimal | |
| total | decimal | |
| currency | text | |
| status | text | draft/sent/paid/overdue |
| transaction_id | uuid, FK | |

#### invoice_line_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| invoice_id | uuid, FK | |
| description | text | |
| quantity | decimal | |
| unit_price | decimal | |
| amount | decimal | |
| tax_code | text | |
| tax_amount | decimal | |
| hsn_sac_code | text | India-specific |
| account_id | uuid, FK | maps to COA |

#### bank_statements
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| bank_name | text | |
| account_number | text | |
| statement_date | date | |
| uploaded_at | timestamptz | |

#### bank_statement_entries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| statement_id | uuid, FK → bank_statements | |
| date | date | |
| description | text | |
| amount | decimal | |
| type | text | debit/credit |
| matched_transaction_id | uuid, FK → transactions | null if unmatched |
| reconciliation_status | text | pending/matched/confirmed/unmatched |

#### integrations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| platform | text | tally/quickbooks/sage/zoho/wave/sap |
| access_token | text | AES-256-GCM encrypted at application layer |
| refresh_token | text | AES-256-GCM encrypted at application layer |
| token_expires_at | timestamptz | |
| last_sync_at | timestamptz | |
| sync_status | text | |
| config | jsonb | platform-specific |

#### chat_history
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| session_id | uuid | groups messages into conversations |
| role | text | user/assistant |
| message | text | |
| action_taken | jsonb | what AI did |
| created_at | timestamptz | |

#### audit_log (immutable)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | who made the change |
| entity_type | text | transaction/invoice/account/etc. |
| entity_id | uuid | |
| action | text | create/update/delete |
| old_values | jsonb | previous state |
| new_values | jsonb | new state |
| source | text | manual/ai_chat/receipt_scan/api |
| created_at | timestamptz | immutable, no updates allowed |

#### recurring_transactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, FK | |
| description | text | |
| frequency | text | daily/weekly/monthly/quarterly/yearly |
| next_due_date | date | |
| template_lines | jsonb | debit/credit template |
| is_active | boolean | |
| last_created_at | timestamptz | |

### Key Design Decisions
- **Double-entry bookkeeping** — every transaction has debit/credit lines that must balance
- **Country-aware tax rules** — separate table with rates, HSN codes, effective dates
- **Receipt → Transaction pipeline** — receipts scanned, extracted, then linked to confirmed transactions
- **Immutable audit log** — every create/update/delete logged with old/new values, source, and user
- **Multi-currency** — exchange rates stored per transaction
- **Row-Level Security** — users only see their own data

---

## 4. Feature Modules

### Module 1: Landing Page & Marketing
- Hero section with product demo animation
- Feature highlights, pricing tiers, country support
- Social proof, testimonials
- CTA → Sign up (email/password)

### Module 2: Onboarding (First-time Setup)
```
Sign Up → Select Country → Business Type → Currency auto-set
        → Default Chart of Accounts generated for that country
        → Tax rules loaded (GST/VAT/Sales Tax)
        → Dashboard ready
```

### Module 3: Receipt Scanner (Core Feature)
```
Upload/Camera → DeepSeek OCR 2 extracts data
             → AI categorizes: vendor, amount, date, tax, line items
             → User reviews & confirms (1-click)
             → Double-entry transaction auto-created
             → Linked to correct accounts + tax codes
```

### Module 4: AI Chat Console (Conversational Accounting)
- **Query mode:** "What did I spend on travel in Q1?" → answers from data
- **Action mode:** "Record a payment of ₹5000 to vendor ABC" → creates transaction
- **Report mode:** "Show me my balance sheet" → generates and displays
- **Invoice mode:** "Create invoice for Client X" → creates invoice
- Context-aware: knows user's country, currency, tax rules

### Module 5: Accounting Engine
- General Ledger — all accounts with running balances
- Journal entries — manual entry for adjustments
- Balance Sheet — auto-generated (Assets = Liabilities + Equity)
- Profit & Loss — income vs expenses for any period
- Trial Balance — all account balances for verification
- Cash Flow Statement
- GST/VAT/Tax reports per country

### Module 6: Bank Reconciliation
```
Upload bank statement (CSV/PDF) → AI parses entries
    → Auto-matches with existing transactions
    → Flags unmatched entries for review
    → User confirms matches → status = reconciled
```

### Module 7: Invoice Management
- Create, send, track invoices
- Auto-apply tax based on country rules
- Mark as paid → auto-creates transaction
- Overdue reminders

### Module 8: Export & Integrations
- Tally XML export (vouchers, masters, ledgers)
- QuickBooks sync via OAuth API
- Sage sync via OAuth API (v3.1)
- Zoho Books sync via OAuth API
- Wave sync via OAuth/GraphQL API
- SAP sync via OData v4 Service Layer
- Generic CSV/PDF export for any platform

### Module 9: Dashboard
- Revenue/expense overview (charts)
- Recent transactions
- Pending receipts to review
- Outstanding invoices
- Quick actions: scan receipt, record transaction, ask AI

---

## 5. Pricing

| Feature | Free | Starter ($9/mo) | Pro ($29/mo) | Enterprise ($79/mo) |
|---------|------|------------------|--------------|---------------------|
| Receipts/month | 25 | 200 | Unlimited | Unlimited |
| AI chat queries | 50/mo | 500/mo | Unlimited | Unlimited |
| Integrations | CSV export only | 2 platforms | All 6 platforms | All 6 + priority |
| Bank reconciliation | — | Manual only | AI-assisted | AI-assisted |
| Countries | 1 | 3 | All | All + custom tax |
| Team members | 1 | 2 | 5 | Unlimited |
| Reports | Basic P&L | Full reports | Full + custom | Full + API access |

---

## 6. AI Architecture

### Receipt Processing Pipeline

```
Receipt Image → DeepSeek OCR 2 → Structured JSON
    → AI Categorizer (DeepSeek Chat) → Maps to COA + tax codes
    → Transaction Builder → Double-entry with tax splits
```

### Chat AI Architecture

```
User message → Intent classifier (DeepSeek)
  ├── QUERY → Parameterized query builder → execute on read-only replica → format response
  ├── ACTION → validate → create transaction/invoice → confirm with user → commit
  ├── REPORT → generate report → render → offer export
  └── GENERAL → accounting help / explanation
```

The AI has a **tool/function-calling layer** that can:
- Query the database (read-only for queries)
- Create transactions, invoices, journal entries (write for actions)
- Generate reports (balance sheet, P&L, trial balance)
- All write actions require user confirmation before committing

### AI Query Security (SQL Injection Prevention)
- AI does NOT generate raw SQL. It generates structured query intents (entity, filters, date range, aggregation)
- A **parameterized query builder** translates intents to safe, parameterized SQL
- Queries run on a **read-only database connection** (Supabase read replica or read-only role)
- All queries are scoped to the current user via RLS + explicit `user_id` filter
- Query allow-list: only SELECT on predefined views (no DDL, no writes, no joins to auth tables)
- Rate limiting: max 10 queries/minute per user
- Query result size capped at 1000 rows

### AI Provider Abstraction
- All AI calls go through an abstraction layer (`ai-provider/`)
- Primary: DeepSeek OCR 2 (receipt scanning), DeepSeek Chat (NL queries)
- Fallback: Google Cloud Vision (OCR), OpenAI/Anthropic (chat) — configurable via env vars
- Circuit breaker: auto-switches to fallback after 3 consecutive failures

---

## 7. Multi-Country Tax Engine

```
tax_engine/
├── base.ts           — Tax engine interface & types
├── india.ts          — GST (CGST/SGST/IGST), HSN/SAC codes, TDS
├── united-states.ts  — State sales tax (nexus-based, uses tax rate API)
├── united-kingdom.ts — VAT (standard 20%, reduced 5%, zero-rated)
├── eu/
│   ├── base.ts       — Common EU VAT logic
│   ├── germany.ts    — DE: 19% standard, 7% reduced
│   ├── france.ts     — FR: 20% standard, 10%/5.5%/2.1% reduced
│   ├── netherlands.ts— NL: 21% standard, 9% reduced
│   ├── spain.ts      — ES: 21% standard, 10%/4% reduced
│   ├── italy.ts      — IT: 22% standard, 10%/5%/4% reduced
│   └── ...           — Other EU member states
├── australia.ts      — GST (flat 10%), BAS reporting
└── new-zealand.ts    — GST (15%), IRD filing
```

Each country module provides:
- Tax rates and rules for that jurisdiction
- Default Chart of Accounts (localized)
- Tax calculation given amount and category
- Report formats specific to that country
- HSN/SAC codes (India), tax codes (others)

### EU-Specific Details
- Users select specific EU member state (DE, FR, NL, etc.) — not "EU" generically
- Intra-EU B2B reverse charge mechanism supported
- OSS (One Stop Shop) rules for cross-border digital services
- VAT registration thresholds tracked per member state

### US-Specific Details
- State sales tax varies across 10,000+ jurisdictions
- Integration with tax rate API (TaxJar/Avalara) for real-time rate lookup
- Nexus tracking: users can configure which states they have tax obligations
- Product taxability rules vary by state (services vs goods)

### Currency Exchange Rates
- Real-time rates from Open Exchange Rates API (free tier: 1000 req/mo)
- Cached daily for offline use
- Manual override option for users

---

## 8. Security & Privacy

- All data encrypted at rest (Supabase default)
- API keys in environment variables only, never client-side
- Receipt images in private Supabase Storage buckets
- Row-Level Security (RLS) on all tables
- OAuth tokens encrypted with AES-256-GCM at application layer; encryption key stored in env var, rotatable
- Rate limiting on AI endpoints (10 queries/min, 100 receipts/day)
- HTTPS everywhere
- Immutable audit log for all data changes (regulatory requirement)
- GDPR Article 20 compliance: full data export (all transactions, receipts, invoices) available to users
- WCAG 2.1 AA accessibility compliance for all UI components

---

## 9. PWA Capabilities

- Installable on mobile home screen
- Camera access for receipt scanning
- Offline queue — scan receipts offline, sync when back online
- Push notifications — overdue invoices, reconciliation reminders
- Responsive — mobile, tablet, desktop

---

## 10. User Flow (Happy Path)

1. User signs up → picks country (India) → business type (Freelancer)
2. Dashboard loads with default Indian COA + GST rules
3. Snaps photo of restaurant bill → AI extracts: ₹1,240, Food & Dining, 5% GST
4. User confirms → transaction created: Debit Food Expense ₹1,181, Debit GST Input ₹59, Credit Cash ₹1,240
5. Types in chat: "How much have I spent on food this month?"
6. AI responds: "₹4,820 across 6 transactions this month"
7. End of month: clicks "Generate Balance Sheet" → ready to export
8. Exports to Tally XML → imports into Tally ERP

---

## 11. Integration APIs Reference

| Platform | Auth | API Type | Key Endpoints |
|----------|------|----------|---------------|
| Tally | N/A (file export) | XML import | Vouchers, Masters, Ledgers |
| QuickBooks | OAuth 2.0 | REST | /invoice, /purchase, /account |
| Sage | OAuth 2.0 | REST v3.1 | /ledger_accounts, /contact_payments |
| Zoho Books | OAuth 2.0 | REST v3 | /invoices, /expenses, /chartofaccounts |
| Wave | OAuth 2.0 | GraphQL | businesses, invoices, transactions |
| SAP B1 | Session/OAuth | OData v4 | JournalEntries, BusinessPartners |

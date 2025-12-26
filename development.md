# Metric - Development Plan

> Privacy-first, open-source web analytics platform

## Project Overview

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Supabase (Lovable Cloud)

**Current Progress:** 17/32 features implemented (53%)

---

## MVP Feature Checklist

### ✅ Implemented Features (17)

| Feature | Difficulty | Category | Description |
|---------|------------|----------|-------------|
| Page Views | Easy | Analytics | Track page views across your site |
| Visitors | Easy | Analytics | Unique visitor counting and sessions |
| Bounce Rate | Easy | Analytics | Single-page session detection |
| Traffic Sources | Easy | Analytics | Referrer and source tracking |
| Location | Easy | Analytics | Country and city-level geo data |
| Devices | Easy | Analytics | Browser, OS, and device type detection |
| Languages | Easy | Analytics | Browser language preferences |
| Realtime Data | Easy | Analytics | Live visitor activity feed |
| No Cookies | Easy | Privacy | Cookie-free tracking by default |
| GDPR & CCPA | Easy | Privacy | Built-in compliance features |
| Custom Events | Medium | Analytics | Track custom user actions |
| UTM Tracking | Medium | Analytics | Campaign parameter tracking |
| Teams | Medium | Analytics | Multi-user collaboration |
| Data Export | Medium | Cloud | Export analytics as CSV/JSON |
| Funnels | Hard | Insights | Multi-step conversion tracking |
| Retention | Hard | Insights | User retention cohort analysis |
| Goals | Hard | Insights | Conversion goal tracking |

### ⬜ Not Implemented Features (15)

| Feature | Difficulty | Category | Description | Phase |
|---------|------------|----------|-------------|-------|
| Filtering | Easy | Analytics | Filter by country, browser, URL | 1 |
| Data Anonymization | Easy | Privacy | IP hashing, data purging options | 1 |
| Sharing | Medium | Analytics | Public dashboard URLs | 3 |
| Segments | Medium | Insights | Saved filter presets | 3 |
| Compare | Medium | Insights | Period-over-period comparison | 2 |
| Links | Medium | Analytics | Outbound link click tracking | 2 |
| Pixels | Medium | Analytics | Embeddable tracking pixels | 2 |
| Data Import | Medium | Cloud | CSV/JSON import, GA migration | 5 |
| Insights | Hard | Insights | AI-powered anomaly detection | 4 |
| Cohorts | Hard | Insights | Behavioral user grouping | 4 |
| Breakdown | Hard | Insights | Multi-dimensional analysis | 4 |
| Journey | Hard | Insights | User flow visualization | 4 |
| Revenue | Hard | Insights | Ecommerce tracking | 5 |
| Attribution | Hard | Insights | Multi-touch attribution models | 5 |
| Email Reports | Hard | Cloud | Scheduled digest emails | 5 |

---

## Development Phases

### Phase 1: Core Foundation Enhancement (DETAILED)

**Priority:** Quick wins & security hardening  
**Estimated Effort:** 1-2 weeks  
**Status:** 🔄 In Progress

#### Features

- [x] **Security Hardening** ✅
  - RLS policies on all tables
  - API key authentication for public API
  - MFA support with backup codes
  - Session management

- [ ] **Filtering**
  - Add filter dropdowns to analytics dashboard
  - Filter by: Country, Browser, OS, Device, URL path, Referrer
  - Persist filters in URL query params
  - Files to modify:
    - `src/pages/SiteDetail.tsx` - Add filter state
    - `src/components/analytics/FilterBar.tsx` - New component
    - `src/hooks/useAnalytics.ts` - Add filter params to queries

- [ ] **Data Anonymization**
  - IP address hashing before storage
  - Configurable data retention periods
  - Bulk data purge functionality
  - Files to modify:
    - `supabase/functions/track/index.ts` - Hash IPs
    - `src/pages/Settings.tsx` - Add retention settings
    - Database: Add `data_retention_days` to sites table

#### Phase 1 Deliverables
1. FilterBar component with multi-select filters
2. URL-based filter persistence
3. IP anonymization in tracking endpoint
4. Data retention configuration UI

---

### Phase 2: Analytics Expansion

**Priority:** Extend core analytics capabilities  
**Estimated Effort:** 2-3 weeks  
**Status:** ⬜ Not Started

#### Features

- [ ] **Compare**
  - Period-over-period comparison (this week vs last week)
  - Visual diff indicators on all metrics
  - Comparison toggle in date picker
  - Files to create:
    - `src/hooks/useComparisonData.ts`
    - `src/components/analytics/ComparisonIndicator.tsx`

- [ ] **Links**
  - Track outbound link clicks
  - Automatic link interception via tracking script
  - Top outbound links table
  - Files to modify:
    - `public/track.js` - Add click listener
    - `src/components/analytics/OutboundLinks.tsx` - New component

- [ ] **Pixels**
  - Generate embeddable 1x1 tracking pixels
  - Email open tracking support
  - Pixel management UI
  - Files to create:
    - `supabase/functions/pixel/index.ts`
    - `src/components/settings/PixelManager.tsx`

---

### Phase 3: Collaboration & Sharing

**Priority:** Team and sharing features  
**Estimated Effort:** 1-2 weeks  
**Status:** ⬜ Not Started

#### Features

- [ ] **Sharing**
  - Generate public dashboard URLs
  - Password protection option
  - Expiring share links
  - Embed code generation
  - Files to create:
    - `src/pages/PublicDashboard.tsx`
    - `src/components/settings/ShareSettings.tsx`
    - Database: `shared_dashboards` table

- [ ] **Segments**
  - Save filter combinations as named segments
  - Quick segment switcher
  - Segment-based alerts
  - Files to create:
    - `src/hooks/useSegments.ts`
    - `src/components/analytics/SegmentSelector.tsx`
    - Database: `segments` table

---

### Phase 4: Advanced Insights

**Priority:** Deep analytics and behavior tracking  
**Estimated Effort:** 4-6 weeks  
**Status:** ⬜ Not Started

#### Features

- [ ] **Insights**
  - AI-powered anomaly detection
  - Automatic trend identification
  - Weekly insight summaries
  - Uses Lovable AI gateway (no API key needed)
  - Files to create:
    - `supabase/functions/generate-insights/index.ts`
    - `src/components/analytics/InsightsPanel.tsx`

- [ ] **Cohorts**
  - Group users by behavior patterns
  - First-touch vs returning visitor analysis
  - Custom cohort definitions
  - Files to create:
    - `src/hooks/useCohorts.ts`
    - `src/components/analytics/CohortAnalysis.tsx`

- [ ] **Breakdown**
  - Multi-dimensional data slicing
  - Pivot table interface
  - Custom dimension combinations
  - Files to create:
    - `src/components/analytics/BreakdownTable.tsx`
    - `src/hooks/useBreakdown.ts`

- [ ] **Journey**
  - User flow visualization
  - Sankey diagram for page paths
  - Drop-off analysis
  - Files to create:
    - `src/components/analytics/JourneyFlow.tsx`
    - `src/hooks/useJourneyData.ts`

---

### Phase 5: Enterprise & Scale (DETAILED)

**Priority:** Revenue features and enterprise readiness  
**Estimated Effort:** 6-8 weeks  
**Status:** ⬜ Not Started

#### Features

- [ ] **Revenue Tracking**
  - Ecommerce event tracking (purchase, add_to_cart, checkout)
  - Revenue attribution to sources
  - Integration options:
    - Stripe webhook integration
    - Shopify app integration
    - Manual revenue events
  - Files to create:
    - `supabase/functions/stripe-webhook/index.ts`
    - `src/components/analytics/RevenueStats.tsx`
    - `src/hooks/useRevenue.ts`
  - Database changes:
    - Add `revenue` and `currency` columns to events table
    - Create `revenue_summary` materialized view

- [ ] **Attribution**
  - Multi-touch attribution models:
    - First-touch
    - Last-touch
    - Linear
    - Time-decay
    - Position-based
  - Attribution reports per campaign
  - Files to create:
    - `src/components/analytics/AttributionReport.tsx`
    - `src/hooks/useAttribution.ts`
    - `supabase/functions/calculate-attribution/index.ts`

- [ ] **Email Reports**
  - Scheduled weekly/monthly digests
  - Customizable report content
  - Multiple recipient support
  - Implementation:
    - Use Resend for email delivery
    - Supabase pg_cron for scheduling
  - Files to create:
    - `supabase/functions/send-report/index.ts`
    - `src/components/settings/EmailReportSettings.tsx`
  - Required secrets: `RESEND_API_KEY`

- [ ] **Data Import**
  - CSV/JSON file upload
  - Google Analytics import wizard
  - Data validation and preview
  - Files to create:
    - `src/components/settings/DataImport.tsx`
    - `supabase/functions/import-data/index.ts`

- [ ] **High Performance**
  - Query optimization with proper indexing
  - Data partitioning by date
  - Redis caching layer for hot data
  - Materialized views for aggregations
  - Database changes:
    - Add indexes on `created_at`, `site_id`
    - Create partitioned events table
    - Add caching edge function

#### Phase 5 Architecture Notes

```
┌─────────────────┐     ┌──────────────────┐
│  Stripe/Shopify │────▶│ Webhook Handler  │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌──────────────────┐
│  Revenue Events │◀────│   Events Table   │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌──────────────────┐
│ Attribution Calc│◀────│ Materialized View│
└─────────────────┘     └──────────────────┘
```

---

## Progress by Category

| Category | Implemented | Total | Progress |
|----------|-------------|-------|----------|
| Analytics | 11 | 13 | 85% |
| Insights | 3 | 10 | 30% |
| Privacy | 2 | 3 | 67% |
| Cloud | 1 | 5 | 20% |

---

## Security Checklist

- [x] RLS policies on all tables (100% coverage)
- [x] API key authentication for public endpoints
- [x] MFA support with TOTP
- [x] Backup codes for account recovery
- [x] Session management and login history
- [x] No exposed private keys in codebase
- [x] Proper storage bucket policies
- [ ] Rate limiting on tracking endpoint
- [ ] CAPTCHA on auth forms

---

## Code Quality Standards

- TypeScript strict mode enabled
- ESLint configuration enforced
- Component-based architecture
- Custom hooks for data fetching
- Semantic design tokens (no hardcoded colors)
- Responsive design required for all components

---

## Quick Start for Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck
```

---

## Next Steps

1. **Phase 1 Priority:** Implement Filtering feature
2. **Phase 1 Priority:** Add Data Anonymization
3. **Phase 2 Quick Win:** Add Compare functionality
4. Continue iterating based on user feedback

---

*Last Updated: December 2024*

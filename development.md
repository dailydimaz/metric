# mmmetric - Development Plan

> Privacy-first, open-source web analytics platform

## Project Overview

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Supabase (Lovable Cloud)

**Current Progress:** 38/42 features implemented (90%)

---

## MVP Feature Checklist

### ✅ Implemented Features (38)

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
| Filtering | Easy | Analytics | Filter by country, browser, URL |
| No Cookies | Easy | Privacy | Cookie-free tracking by default |
| GDPR & CCPA | Easy | Privacy | Built-in compliance features |
| Data Anonymization | Easy | Privacy | IP hashing, data anonymization |
| Custom Events | Medium | Analytics | Track custom user actions |
| Insight Properties | Medium | Analytics | Deep dive into event properties |
| UTM Tracking | Medium | Analytics | Campaign parameter tracking |
| Teams | Medium | Analytics | Multi-user collaboration with roles |
| Data Export | Medium | Cloud | Export analytics as CSV/JSON |
| Public Dashboards | Medium | Insights | Share via secure URL with password protection |
| Segments | Medium | Insights | Saved filter presets |
| Compare | Medium | Insights | Period-over-period comparison |
| Links | Medium | Analytics | Redirect-based link tracking |
| Pixels | Medium | Analytics | Embeddable tracking pixels |
| Data Import | Medium | Cloud | CSV/JSON file import |
| X (Twitter) Analytics | Medium | Analytics | Track mentions from X |
| Public API | Medium | Cloud | Programmatic access with API keys |
| Webhooks | Medium | Cloud | Slack notifications for events |
| Command Menu | Medium | Analytics | Keyboard navigation (Cmd+K) |
| Funnels | Hard | Insights | Multi-step conversion tracking |
| Retention | Hard | Insights | User retention cohort matrix |
| Goals | Hard | Insights | Conversion goals with revenue tracking & AOV |
| Insights | Hard | Insights | Custom shareable reports |
| Cohorts | Hard | Insights | Behavioral user grouping |
| Breakdown | Hard | Insights | Multi-dimensional analysis |
| Journey | Hard | Insights | User flow visualization |
| Revenue | Hard | Insights | Ecommerce tracking via goal properties |
| Attribution | Hard | Insights | First-touch, last-touch, linear models |
| Email Reports | Hard | Cloud | Scheduled email digests via Resend |
| High Performance | Hard | Cloud | Rollups optimized for scale |
| Cross-domain Tracking | Hard | Analytics | Unified multi-domain analytics |

### ⬜ Not Implemented Features (4)

| Feature | Difficulty | Category | Description | Status |
|---------|------------|----------|-------------|--------|
| Google Search Console | Medium | Insights | SEO keywords and organic traffic | Requires Google Cloud credentials |
| White Labeling | Medium | Cloud | Custom branding for dashboards | Planned |
| Shopify Integration | Hard | Cloud | Automatic revenue tracking | Requires Shopify webhook secret |
| GA Import | Hard | Cloud | Import from Google Analytics | Requires Google Cloud credentials |

---

## Progress by Category

| Category | Implemented | Total | Progress |
|----------|-------------|-------|----------|
| Analytics | 16 | 16 | 100% |
| Insights | 13 | 14 | 93% |
| Privacy | 3 | 3 | 100% |
| Cloud | 6 | 9 | 67% |

---

## Security Checklist

- [x] RLS policies on all tables (100% coverage)
- [x] API key authentication for public endpoints
- [x] MFA support with TOTP
- [x] Backup codes for account recovery
- [x] Session management and login history
- [x] No exposed private keys in codebase
- [x] Proper storage bucket policies
- [x] Rate limiting on tracking endpoint
- [ ] CAPTCHA on auth forms

---

## Architecture Highlights

### Data Pipeline
```
┌─────────────────┐     ┌──────────────────┐
│  track.js       │────▶│ /track endpoint  │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌──────────────────┐
│ events_partitioned│◀──│   Raw Events     │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌──────────────────┐
│ Hourly Rollups  │◀────│  Aggregation Job │
└─────────────────┘     └──────────────────┘
```

### Key RPCs
- `get_site_stats` - Core metrics with rollup optimization
- `get_attribution_stats` - Multi-touch attribution models
- `get_goal_stats` - Revenue and conversion tracking
- `get_user_journeys` - Navigation path analysis
- `get_shared_insight` - Public insights (SECURITY DEFINER)

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

## Pending External Credentials

The following features are hidden behind "Coming Soon" until credentials are provided:

1. **Shopify Integration** - Requires `SHOPIFY_WEBHOOK_SECRET`
2. **Google Analytics Import** - Requires Google Cloud OAuth
3. **Google Search Console** - Requires Google Cloud OAuth

---

*Last Updated: January 2025*

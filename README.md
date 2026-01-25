<p align="center">
  <img src="src/assets/mmmetric-logo.png" alt="mmmetric Logo" width="80" height="80">
</p>

<h1 align="center">mmmetric</h1>

<p align="center">
  <strong>Privacy-first, open-source web analytics</strong>
</p>

<p align="center">
  Simple, fast, and privacy-focused analytics for your websites and applications.
  <br />
  No cookies. GDPR compliant. Self-hostable.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#self-hosting">Self-Hosting</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

- **Privacy-First**: No cookies, no personal data collection, GDPR/CCPA compliant
- **Lightweight**: < 1KB tracking script, zero impact on Core Web Vitals
- **Real-time Analytics**: See visitors on your site as it happens
- **Custom Events**: Track button clicks, form submissions, and any custom events
- **Funnel Analysis**: Understand your conversion funnel and optimize user flow
- **Retention Cohorts**: Track user retention over time
- **Open Source**: MIT licensed, self-hostable, fully transparent

## 🚀 Getting Started

### Quick Start (Cloud)

1. Visit [mmmetric.lovable.app](https://mmmetric.lovable.app) and sign up
2. Add your first website
3. Copy the tracking script to your site's `<head>` tag
4. Start collecting insights!

### Self-Hosting

mmmetric can be fully self-hosted using Supabase as the backend. No vendor lock-in — Supabase itself can also be [self-hosted](https://supabase.com/docs/guides/self-hosting).

#### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works) or self-hosted Supabase instance

#### Installation

```bash
# Clone the repository
git clone https://github.com/dailydimaz/mmmetric.git
cd mmmetric

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your Supabase credentials in .env (see Environment Variables below)

# Run database migrations
# Apply the SQL files in supabase/migrations/ to your Supabase project
# via the Supabase dashboard SQL editor or CLI

# Start development server
npm run dev
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase instance URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Optional | Project ID (derived from URL if omitted) |
| `VITE_APP_URL` | Optional | Your app URL (defaults to `window.location.origin`) |
| `VITE_APP_NAME` | Optional | Custom branding name (defaults to "mmmetric") |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | **Leave empty** for self-hosted (unlocks all features) |

#### Edge Function Secrets

Configure these in your Supabase dashboard under **Edge Functions → Secrets** or via CLI:

```bash
supabase secrets set RESEND_API_KEY=your-resend-key
supabase secrets set APP_URL=https://analytics.yourdomain.com
supabase secrets set APP_NAME=YourAnalytics
supabase secrets set EMAIL_FROM="Analytics <reports@yourdomain.com>"
supabase secrets set CRON_SECRET=your-random-secret
supabase secrets set ALLOWED_DEV_ORIGINS=localhost,staging.yourdomain.com
```

| Secret | Required | Description |
|--------|----------|-------------|
| `RESEND_API_KEY` | For emails | [Resend.com](https://resend.com) API key for email reports |
| `APP_URL` | For emails | Your application URL for links in emails |
| `APP_NAME` | Optional | Application name in emails (default: mmmetric) |
| `EMAIL_FROM` | Optional | Email sender address |
| `CRON_SECRET` | For scheduled jobs | Secret to authenticate cron requests |
| `ALLOWED_DEV_ORIGINS` | Optional | Comma-separated domains to allow for development |

#### Production Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy the `dist/` folder to any static hosting provider:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- Your own server

#### Edge Functions Deployment

Deploy edge functions to your Supabase project:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-id

# Deploy all functions
supabase functions deploy
```

#### Supabase Configuration

For self-hosted Supabase instances, regenerate `supabase/config.toml`:

```bash
supabase init
```

Then apply all migrations from `supabase/migrations/` to your database.

#### GeoIP Setup (Optional)

For visitor geolocation (country/city detection), mmmetric uses a self-hosted IP database:

1. **Quick Start** - The database includes sample data for testing. For production, import a full dataset.

2. **Import GeoIP Data** - Download free data from [DB-IP Lite](https://db-ip.com/db/lite.php) (no registration) or [MaxMind GeoLite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data/) (free account required):

```sql
-- Import locations from GeoLite2-City-Locations-en.csv
\copy temp_locations FROM 'GeoLite2-City-Locations-en.csv' WITH CSV HEADER;
INSERT INTO geoip_locations (geoname_id, country_code, country_name, city_name)
SELECT geoname_id, country_iso_code, country_name, city_name FROM temp_locations;

-- Import IP blocks from GeoLite2-City-Blocks-IPv4.csv  
\copy temp_blocks FROM 'GeoLite2-City-Blocks-IPv4.csv' WITH CSV HEADER;
INSERT INTO geoip_blocks (network, geoname_id)
SELECT network::inet, geoname_id FROM temp_blocks WHERE geoname_id IS NOT NULL;
```

See [docs/geoip-import.md](docs/geoip-import.md) for detailed instructions.

3. **How It Works** - The tracking function automatically looks up visitor IPs against your local database - no external API calls, no rate limits, complete privacy.

## 📊 Usage

### Adding the Tracking Script

Add this script to your website's `<head>` tag:

```html
<script defer 
  src="https://your-analytics-domain.com/track.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://your-supabase-url.supabase.co/functions/v1/track">
</script>
```

**Important:** The `data-api` attribute is required and should point to your Supabase Edge Functions URL.

For cloud users:
```html
<script defer 
  src="https://mmmetric.lovable.app/track.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://lckjlefupqlblfcwhbom.supabase.co/functions/v1/track">
</script>
```

### Tracking Custom Events

```javascript
// Track a custom event
mmmetric.track('button_click', { button_id: 'cta-hero' });

// Track a form submission
mmmetric.track('form_submit', { form_name: 'newsletter' });
```

### Tracking Pixel (Email/No-JS)

For environments without JavaScript:

```html
<img src="https://your-supabase-url.supabase.co/functions/v1/pixel?site_id=YOUR_TRACKING_ID" alt="" />
```

## 🏗️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State Management**: TanStack Query

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## 📄 License

mmmetric is open-source software licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Inspired by [Umami](https://umami.is), [Plausible](https://plausible.io), and other privacy-focused analytics tools.

---

<p align="center">
  Made with ❤️ for privacy
</p>

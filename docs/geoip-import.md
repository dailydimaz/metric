# GeoIP Data Import Guide

This guide explains how to import GeoIP data into your analytics database for IP-based geolocation.

## Data Sources

### Option 1: DB-IP Lite (Recommended - No Registration Required)

**Free, CC Attribution License, Updated Monthly**

Download from: https://db-ip.com/db/lite.php

1. Download **IP to City Lite** in CSV format:
   - `dbip-city-lite-YYYY-MM.csv.gz`

### Option 2: MaxMind GeoLite2 (Requires Free Account)

**Free with registration, Attribution License**

1. Sign up at: https://www.maxmind.com/en/geolite2/signup
2. Download **GeoLite2 City CSV** package containing:
   - `GeoLite2-City-Locations-en.csv`
   - `GeoLite2-City-Blocks-IPv4.csv`

---

## Import Instructions

### For DB-IP Lite CSV

The DB-IP CSV format is simpler - each row contains the IP range and location data together:
```
ip_start,ip_end,continent,country,stateprov,city,latitude,longitude
```

**Step 1: Download and extract**
```bash
curl -O https://download.db-ip.com/free/dbip-city-lite-2025-01.csv.gz
gunzip dbip-city-lite-2025-01.csv.gz
```

**Step 2: Convert to import format**

Create a Node.js script `convert-dbip.mjs`:

```javascript
import { readFileSync, writeFileSync } from 'fs';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function convertDbIp(inputFile) {
  const locations = new Map();
  const blocks = [];
  let geonameId = 1;

  const fileStream = createReadStream(inputFile);
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    // Skip header if present
    if (line.startsWith('ip_start')) continue;
    
    const parts = line.split(',').map(p => p.replace(/"/g, ''));
    if (parts.length < 6) continue;
    
    const [ipStart, ipEnd, continent, countryCode, stateprov, city] = parts;
    
    // Skip IPv6 for now (contains colons)
    if (ipStart.includes(':')) continue;
    
    // Create location key
    const locationKey = `${countryCode}|${city}`;
    
    if (!locations.has(locationKey)) {
      locations.set(locationKey, {
        geoname_id: geonameId++,
        country_code: countryCode,
        country_name: countryCode, // DB-IP doesn't include full country name
        city_name: city || null
      });
    }
    
    const loc = locations.get(locationKey);
    
    // Convert IP range to CIDR (simplified - uses /24 blocks)
    // For production, use a proper IP-to-CIDR converter
    blocks.push({
      network: `${ipStart}/32`, // Simplified - real import should calculate CIDR
      geoname_id: loc.geoname_id
    });
  }

  // Write locations SQL
  let locationsSql = `-- Truncate existing data
TRUNCATE public.geoip_locations CASCADE;
TRUNCATE public.geoip_blocks;

-- Insert locations
INSERT INTO public.geoip_locations (geoname_id, country_code, country_name, city_name) VALUES\n`;
  
  const locArray = Array.from(locations.values());
  locationsSql += locArray.map(l => 
    `(${l.geoname_id}, '${l.country_code}', '${l.country_name}', ${l.city_name ? `'${l.city_name.replace(/'/g, "''")}'` : 'NULL'})`
  ).join(',\n') + ';\n';

  writeFileSync('geoip-locations.sql', locationsSql);
  console.log(`Wrote ${locArray.length} locations to geoip-locations.sql`);
}

convertDbIp(process.argv[2] || 'dbip-city-lite-2025-01.csv');
```

### For MaxMind GeoLite2

**Step 1: Download and extract**
```bash
# After logging into MaxMind, download GeoLite2-City-CSV.zip
unzip GeoLite2-City-CSV_*.zip
```

**Step 2: Import locations**

```sql
-- Create temporary import table
CREATE TEMP TABLE temp_locations (
  geoname_id INTEGER,
  locale_code TEXT,
  continent_code TEXT,
  continent_name TEXT,
  country_iso_code TEXT,
  country_name TEXT,
  subdivision_1_iso_code TEXT,
  subdivision_1_name TEXT,
  subdivision_2_iso_code TEXT,
  subdivision_2_name TEXT,
  city_name TEXT,
  metro_code TEXT,
  time_zone TEXT,
  is_in_european_union TEXT
);

-- Copy from CSV (run from psql or use a SQL client)
\copy temp_locations FROM 'GeoLite2-City-Locations-en.csv' WITH CSV HEADER;

-- Insert into production table
TRUNCATE public.geoip_locations CASCADE;
INSERT INTO public.geoip_locations (geoname_id, country_code, country_name, city_name)
SELECT geoname_id, country_iso_code, country_name, city_name
FROM temp_locations
WHERE country_iso_code IS NOT NULL;

DROP TABLE temp_locations;
```

**Step 3: Import IPv4 blocks**

```sql
-- Create temporary import table
CREATE TEMP TABLE temp_blocks (
  network TEXT,
  geoname_id INTEGER,
  registered_country_geoname_id INTEGER,
  represented_country_geoname_id INTEGER,
  is_anonymous_proxy INTEGER,
  is_satellite_provider INTEGER,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy_radius INTEGER
);

-- Copy from CSV
\copy temp_blocks FROM 'GeoLite2-City-Blocks-IPv4.csv' WITH CSV HEADER;

-- Insert into production table (only rows with valid geoname_id)
TRUNCATE public.geoip_blocks;
INSERT INTO public.geoip_blocks (network, geoname_id)
SELECT network::inet, geoname_id
FROM temp_blocks
WHERE geoname_id IS NOT NULL
  AND network IS NOT NULL;

DROP TABLE temp_blocks;
```

---

## Quick Test Data

For testing without downloading the full database, here's sample data:

```sql
-- Clear test data
TRUNCATE public.geoip_locations CASCADE;
TRUNCATE public.geoip_blocks;

-- Insert sample locations
INSERT INTO public.geoip_locations (geoname_id, country_code, country_name, city_name) VALUES
(5128581, 'US', 'United States', 'New York'),
(5368361, 'US', 'United States', 'Los Angeles'),
(2643743, 'GB', 'United Kingdom', 'London'),
(2950159, 'DE', 'Germany', 'Berlin'),
(2988507, 'FR', 'France', 'Paris'),
(1850147, 'JP', 'Japan', 'Tokyo'),
(2147714, 'AU', 'Australia', 'Sydney'),
(6167865, 'CA', 'Canada', 'Toronto'),
(3435910, 'BR', 'Brazil', 'São Paulo'),
(1277333, 'IN', 'India', 'Bangalore');

-- Insert sample IP blocks (common ranges)
INSERT INTO public.geoip_blocks (network, geoname_id) VALUES
-- US ranges
('8.0.0.0/8', 5128581),        -- New York area
('104.0.0.0/8', 5368361),      -- Los Angeles area
('172.217.0.0/16', 5368361),   -- Google (LA)
-- UK ranges
('185.0.0.0/8', 2643743),      -- London
-- Germany
('46.0.0.0/8', 2950159),       -- Berlin
-- France  
('78.0.0.0/8', 2988507),       -- Paris
-- Japan
('126.0.0.0/8', 1850147),      -- Tokyo
-- Australia
('1.0.0.0/8', 2147714),        -- Sydney (partial)
('203.0.0.0/8', 2147714),      -- Sydney
-- Canada
('24.0.0.0/8', 6167865),       -- Toronto area
-- Brazil
('177.0.0.0/8', 3435910),      -- São Paulo
-- India
('49.0.0.0/8', 1277333);       -- Bangalore
```

---

## Verify Import

```sql
-- Check location count
SELECT COUNT(*) FROM public.geoip_locations;

-- Check block count  
SELECT COUNT(*) FROM public.geoip_blocks;

-- Test lookup function
SELECT * FROM public.lookup_geoip('8.8.8.8');
SELECT * FROM public.lookup_geoip('185.1.2.3');
```

---

## Updating Data

Both DB-IP Lite and MaxMind GeoLite2 are updated monthly. Schedule a monthly job to:

1. Download the latest data
2. Import to temporary tables
3. Swap with production tables (to minimize downtime)

```sql
-- Example atomic swap using table rename
ALTER TABLE geoip_blocks RENAME TO geoip_blocks_old;
ALTER TABLE geoip_blocks_new RENAME TO geoip_blocks;
DROP TABLE geoip_blocks_old;
```

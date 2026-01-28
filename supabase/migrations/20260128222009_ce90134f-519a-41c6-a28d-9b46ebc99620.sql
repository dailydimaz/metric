-- Create city_coordinates table to store canonical lat/lng for cities
CREATE TABLE IF NOT EXISTS public.city_coordinates (
    country_code TEXT NOT NULL,
    city_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (country_code, city_name)
);

-- Enable RLS
ALTER TABLE public.city_coordinates ENABLE ROW LEVEL SECURITY;

-- Public read access (reference data like geoip tables)
CREATE POLICY "City coordinates are publicly readable"
ON public.city_coordinates
FOR SELECT
USING (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_city_coordinates_lookup ON public.city_coordinates (country_code, city_name);
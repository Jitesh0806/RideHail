-- Enable PostGIS for spatial queries (optional but useful for location-based queries)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Performance indexes will be created by TypeORM migrations
-- This file is for initial DB setup only

SELECT 'RideHail database initialized' AS status;

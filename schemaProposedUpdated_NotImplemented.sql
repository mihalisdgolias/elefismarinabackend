-- Drop tables in dependency order
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS slot_pricing_rules CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    vessel_name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slots Table
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    slot_name VARCHAR(100) NOT NULL,
    max_length NUMERIC(5,2),
    max_width NUMERIC(5,2),
    max_depth NUMERIC(5,2),
    price NUMERIC(10, 2) NOT NULL,
    slot_type VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slot Pricing Rules Table
CREATE TABLE IF NOT EXISTS slot_pricing_rules (
    id SERIAL PRIMARY KEY,
    slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
    condition TEXT,
    adjustment NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_price NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

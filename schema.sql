
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

-- Slots Table (Updated)
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    slot_name VARCHAR(100) NOT NULL,
    max_length NUMERIC(5,2),  -- e.g., 12.5 meters
    max_width NUMERIC(5,2),   -- beam
    max_depth NUMERIC(5,2),   -- draft
    price NUMERIC(10, 2) NOT NULL, -- base price per hour
    slot_type VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slot Pricing Rules Table
CREATE TABLE IF NOT EXISTS slot_pricing_rules (
    id SERIAL PRIMARY KEY,
    slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    hour INT CHECK (hour BETWEEN 0 AND 23),
    multiplier NUMERIC(4,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Slot Inserts (Updated)
INSERT INTO slots (slot_name, max_length, max_width, max_depth, price, slot_type)
VALUES
('Slot 1', 10.5, 4.2, 2.6, 17.5, 'standard'),
('Slot 2', 11.0, 4.4, 2.7, 20.0, 'standard'),
('Slot 3', 11.5, 4.0, 2.8, 22.5, 'standard'),
('Slot 4', 12.0, 4.2, 2.5, 25.0, 'standard'),
('Slot 5', 12.5, 4.4, 2.6, 15.0, 'premium'),
('Slot 6', 13.0, 4.0, 2.7, 17.5, 'standard'),
('Slot 7', 13.5, 4.2, 2.8, 20.0, 'standard'),
('Slot 8', 14.0, 4.4, 2.5, 22.5, 'standard'),
('Slot 9', 14.5, 4.0, 2.6, 25.0, 'standard'),
('Slot 10', 15.0, 4.2, 2.7, 15.0, 'premium'),
('Slot 11', 15.5, 4.4, 2.8, 17.5, 'standard'),
('Slot 12', 16.0, 4.0, 2.5, 20.0, 'standard'),
('Slot 13', 16.5, 4.2, 2.6, 22.5, 'standard'),
('Slot 14', 17.0, 4.4, 2.7, 25.0, 'standard'),
('Slot 15', 17.5, 4.0, 2.8, 15.0, 'premium'),
('Slot 16', 18.0, 4.2, 2.5, 17.5, 'standard'),
('Slot 17', 18.5, 4.4, 2.6, 20.0, 'standard'),
('Slot 18', 19.0, 4.0, 2.7, 22.5, 'standard'),
('Slot 19', 19.5, 4.2, 2.8, 25.0, 'standard'),
('Slot 20', 20.0, 4.4, 2.5, 15.0, 'premium'),
('Slot 21', 20.5, 4.0, 2.6, 17.5, 'standard'),
('Slot 22', 21.0, 4.2, 2.7, 20.0, 'standard'),
('Slot 23', 21.5, 4.4, 2.8, 22.5, 'standard'),
('Slot 24', 22.0, 4.0, 2.5, 25.0, 'standard'),
('Slot 25', 22.5, 4.2, 2.6, 15.0, 'premium'),
('Slot 26', 23.0, 4.4, 2.7, 17.5, 'standard'),
('Slot 27', 23.5, 4.0, 2.8, 20.0, 'standard'),
('Slot 28', 24.0, 4.2, 2.5, 22.5, 'standard'),
('Slot 29', 24.5, 4.4, 2.6, 25.0, 'standard'),
('Slot 30', 25.0, 4.0, 2.7, 15.0, 'premium');


-- Sample pricing rules: higher rates during peak hours on weekdays
INSERT INTO slot_pricing_rules (slot_id, day_of_week, hour, multiplier)
SELECT
  s.id,
  d,
  h,
  CASE
    WHEN h BETWEEN 8 AND 10 OR h BETWEEN 17 AND 19 THEN 1.20  -- peak hours
    WHEN d IN (0, 6) THEN 1.25  -- weekends
    ELSE 1.00
  END
FROM slots s,
  generate_series(0, 6) AS d,  -- days of week (Sunday to Saturday)
  generate_series(0, 23) AS h;  -- hours of day

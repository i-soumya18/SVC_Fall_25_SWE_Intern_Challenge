-- Database schema for local testing
-- This creates tables compatible with Neon PostgreSQL production schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- Drop tables in reverse order of dependencies (if they exist)
DROP TABLE IF EXISTS contractors;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    reddit_username VARCHAR(100) NOT NULL,
    twitter_username VARCHAR(100),
    youtube_username VARCHAR(100),
    facebook_username VARCHAR(100),
    reddit_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contractors table
CREATE TABLE contractors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    company_slug VARCHAR(100) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    joined_slack BOOLEAN DEFAULT FALSE,
    can_start_job BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email_phone ON users(email, phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contractors_email ON contractors(email);
CREATE INDEX idx_contractors_user_id ON contractors(user_id);
CREATE INDEX idx_contractors_company_slug ON contractors(company_slug);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at 
    BEFORE UPDATE ON contractors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample test data (optional - for development)
-- INSERT INTO users (email, phone, reddit_username, twitter_username, reddit_verified) 
-- VALUES 
--     ('test@example.com', '1234567890', 'testuser', 'testtwitter', true),
--     ('user2@example.com', '0987654321', 'user2', null, false);
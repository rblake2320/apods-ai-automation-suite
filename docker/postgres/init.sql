-- PostgreSQL initialization script for APODS AI-Automation Suite
-- This script runs once when the database is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS apods;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path
ALTER DATABASE apods SET search_path TO apods, public;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on audit log
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON audit.activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_table_name ON audit.activity_log(table_name);

-- Create users table
CREATE TABLE IF NOT EXISTS apods.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create index on users
CREATE INDEX IF NOT EXISTS idx_users_email ON apods.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON apods.users(username);

-- Create sessions table
CREATE TABLE IF NOT EXISTS apods.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES apods.users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create index on sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON apods.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON apods.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON apods.sessions(expires_at);

-- Create automations table
CREATE TABLE IF NOT EXISTS apods.automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES apods.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_run TIMESTAMP WITH TIME ZONE
);

-- Create index on automations
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON apods.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON apods.automations(is_active);

-- Create execution_logs table
CREATE TABLE IF NOT EXISTS apods.execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID NOT NULL REFERENCES apods.automations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    result JSONB,
    duration_ms INTEGER
);

-- Create index on execution_logs
CREATE INDEX IF NOT EXISTS idx_execution_logs_automation_id ON apods.execution_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_started_at ON apods.execution_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON apods.execution_logs(status);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON apods.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON apods.automations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA apods TO apods;
GRANT USAGE ON SCHEMA audit TO apods;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA apods TO apods;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO apods;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA apods TO apods;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO apods;

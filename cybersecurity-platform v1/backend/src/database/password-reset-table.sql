-- Drop table if it exists
DROP TABLE IF EXISTS password_reset_tokens;

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_token UNIQUE(user_id)
);

-- Create index for fast token lookup
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Modify users table to add password reset required field if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' 
                  AND column_name = 'password_reset_required') THEN
        ALTER TABLE users ADD COLUMN password_reset_required BOOLEAN DEFAULT FALSE;
    END IF;
END$$;

-- Add valid_action for password reset to security_logs table check constraint
DO $$
BEGIN
    ALTER TABLE security_logs DROP CONSTRAINT IF EXISTS valid_action;
    ALTER TABLE security_logs ADD CONSTRAINT valid_action CHECK (
        action IN ('login', 'logout', 'register', 'password_change', 
                  'password_reset_request', 'password_reset_complete', 'admin_password_reset',
                  'security_scan', 'crypto_operation', 'reverse_engineering')
    );
END$$; 
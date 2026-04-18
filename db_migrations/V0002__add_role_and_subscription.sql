ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_days INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMP;

UPDATE users SET role = 'admin' WHERE username = 'rounding' OR email LIKE '%rounding%';
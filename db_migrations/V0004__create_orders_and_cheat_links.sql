CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  game VARCHAR(50) NOT NULL,
  days INT NOT NULL,
  amount INT NOT NULL,
  payment_id VARCHAR(255),
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

CREATE TABLE cheat_links (
  id SERIAL PRIMARY KEY,
  game VARCHAR(50) NOT NULL UNIQUE,
  link_url TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
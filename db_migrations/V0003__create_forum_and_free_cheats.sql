CREATE TABLE forum_posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  username VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE free_cheats (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INT,
  username VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
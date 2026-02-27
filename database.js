const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || "drfx"}:${process.env.DB_PASS || "drfx123"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "drfx_quantum"}`,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        role TEXT DEFAULT 'user' CHECK(role IN ('user','admin','bot')),
        subscription_status TEXT DEFAULT 'free' CHECK(subscription_status IN ('free','active')),
        subscription_expiry TIMESTAMPTZ,
        blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('dm','group','channel')),
        username TEXT UNIQUE,
        name TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public','private')),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_members (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member' CHECK(role IN ('admin','member')),
        last_read_id INTEGER DEFAULT 0,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(chat_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT DEFAULT '',
        image TEXT DEFAULT '',
        edited_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payment_id TEXT,
        amount NUMERIC(10,2),
        currency TEXT,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON chat_members(chat_id);
      CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_id_chat ON messages(id, chat_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_chats_username ON chats(username);
    `);

    // Add columns if upgrading from v4.0
    const cols = [
      ["users", "username", "TEXT UNIQUE"],
      ["chats", "username", "TEXT UNIQUE"],
      ["messages", "edited_at", "TIMESTAMPTZ"],
    ];
    for (const [tbl, col, def] of cols) {
      await client.query(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS ${col} ${def}`).catch(() => {});
    }

    // AI Bot
    const { rows: [botExists] } = await client.query("SELECT id FROM users WHERE role='bot' LIMIT 1");
    if (!botExists) {
      const bh = await bcrypt.hash("bot_no_login_" + Date.now(), 10);
      await client.query(
        "INSERT INTO users (email,username,password_hash,name,bio,avatar,role,subscription_status) VALUES ($1,$2,$3,$4,$5,$6,'bot','active')",
        ["ai@drfx.quantum", "drfx_ai", bh, "DrFX AI", "Your AI trading assistant.", "🤖"]
      );
      console.log("✅ AI Bot created");
    }

    // Admin
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@drfx.com").toLowerCase().trim();
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";
    const { rows: [ae] } = await client.query("SELECT id FROM users WHERE email=$1", [adminEmail]);
    if (!ae) {
      const h = await bcrypt.hash(adminPass, 10);
      await client.query(
        "INSERT INTO users (email,username,password_hash,name,role,subscription_status) VALUES ($1,$2,$3,$4,'admin','active')",
        [adminEmail, "admin", h, "Admin"]
      );
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      const h = await bcrypt.hash(adminPass, 10);
      await client.query("UPDATE users SET password_hash=$1, role='admin' WHERE email=$2", [h, adminEmail]);
      console.log(`✅ Admin synced: ${adminEmail}`);
    }
    console.log("✅ PostgreSQL ready");
  } finally { client.release(); }
}

module.exports = { pool, initDB };

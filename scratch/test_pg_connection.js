require('dotenv').config();
const { Pool } = require('pg');

async function test() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000
  });
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Success! Server time:", res.rows[0].now);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await pool.end();
  }
}

test();

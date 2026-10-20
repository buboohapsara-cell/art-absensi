const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool
  .query('SELECT NOW()')
  .then(() => console.log('[db] koneksi Postgres OK'))
  .catch((err) => console.error('[db] gagal konek Postgres:', err.message));

module.exports = { pool };

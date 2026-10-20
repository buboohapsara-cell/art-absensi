require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

function randomPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('art', 'majikan')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_settings (
  id SERIAL PRIMARY KEY,
  normal_checkout_time TIME NOT NULL DEFAULT '17:00',
  weekly_salary NUMERIC NOT NULL DEFAULT 0,
  overtime_rate_per_hour NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('checkin', 'checkout')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

async function seedUser({ username, password, fullName, role }) {
  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows[0]) {
    console.log(`[seed] user "${username}" sudah ada, dilewati.`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
    [username, passwordHash, fullName, role]
  );
  console.log(`[seed] user "${username}" (${role}) dibuat. Password: ${password}`);
}

async function main() {
  console.log('[init-db] membuat tabel...');
  await pool.query(SCHEMA);

  const { rows: settingsRows } = await pool.query('SELECT id FROM work_settings LIMIT 1');
  if (!settingsRows[0]) {
    await pool.query('INSERT INTO work_settings (normal_checkout_time) VALUES ($1)', ['17:00']);
    console.log('[init-db] work_settings default (17:00) dibuat.');
  }

  await seedUser({
    username: process.env.ART_USERNAME || 'art',
    password: process.env.ART_PASSWORD || randomPassword(),
    fullName: process.env.ART_FULL_NAME || 'ART',
    role: 'art',
  });

  await seedUser({
    username: process.env.MAJIKAN_USERNAME || 'majikan',
    password: process.env.MAJIKAN_PASSWORD || randomPassword(),
    fullName: process.env.MAJIKAN_FULL_NAME || 'Majikan',
    role: 'majikan',
  });

  console.log('[init-db] selesai.');
  console.log('[init-db] PENTING: ganti password default ini setelah login pertama kali.');
  await pool.end();
}

main().catch((err) => {
  console.error('[init-db] gagal:', err);
  process.exit(1);
});

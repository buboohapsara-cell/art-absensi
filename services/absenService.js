const { pool } = require('../config/db');

const APP_TIMEZONE = 'Asia/Jakarta';

async function getTodayLogs(userId) {
  const { rows } = await pool.query(
    `SELECT al.*, l.name AS location_name
     FROM attendance_logs al
     LEFT JOIN locations l ON l.id = al.location_id
     WHERE al.user_id = $1
       AND (al.recorded_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date
     ORDER BY al.recorded_at ASC`,
    [userId, APP_TIMEZONE]
  );
  const checkin = rows.find((r) => r.event_type === 'checkin') || null;
  const checkout = rows.find((r) => r.event_type === 'checkout') || null;
  return { checkin, checkout };
}

async function recordAttendance({ userId, eventType, locationId }) {
  const today = await getTodayLogs(userId);

  if (eventType === 'checkin' && today.checkin) {
    throw new Error('Sudah checkin hari ini.');
  }
  if (eventType === 'checkout') {
    if (!today.checkin) {
      throw new Error('Belum checkin hari ini, tidak bisa checkout.');
    }
    if (today.checkout) {
      throw new Error('Sudah checkout hari ini.');
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO attendance_logs (user_id, event_type, location_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, eventType, locationId]
  );
  return rows[0];
}

async function getLogsInRange(userId, startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT al.*, l.name AS location_name
     FROM attendance_logs al
     LEFT JOIN locations l ON l.id = al.location_id
     WHERE al.user_id = $1
       AND (al.recorded_at AT TIME ZONE $4)::date BETWEEN $2 AND $3
     ORDER BY al.recorded_at ASC`,
    [userId, startDate, endDate, APP_TIMEZONE]
  );
  return rows;
}

module.exports = { getTodayLogs, recordAttendance, getLogsInRange, APP_TIMEZONE };

const { pool } = require('../config/db');
const { getAllLocations, findNearestLocation } = require('./locationService');

const APP_TIMEZONE = 'Asia/Jakarta';

async function getTodayLogs(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM attendance_logs
     WHERE user_id = $1
       AND (recorded_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date
     ORDER BY recorded_at ASC`,
    [userId, APP_TIMEZONE]
  );
  const checkin = rows.find((r) => r.event_type === 'checkin') || null;
  const checkout = rows.find((r) => r.event_type === 'checkout') || null;
  return { checkin, checkout };
}

async function recordAttendance({ userId, eventType, latitude, longitude }) {
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

  const locations = await getAllLocations();
  const { location, distanceMeters } = findNearestLocation(latitude, longitude, locations);

  const { rows } = await pool.query(
    `INSERT INTO attendance_logs
       (user_id, event_type, latitude, longitude, nearest_location_id, distance_meters)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, eventType, latitude, longitude, location ? location.id : null, distanceMeters]
  );
  return rows[0];
}

async function getLogsInRange(userId, startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT al.*, l.name AS location_name
     FROM attendance_logs al
     LEFT JOIN locations l ON l.id = al.nearest_location_id
     WHERE al.user_id = $1
       AND (al.recorded_at AT TIME ZONE $4)::date BETWEEN $2 AND $3
     ORDER BY al.recorded_at ASC`,
    [userId, startDate, endDate, APP_TIMEZONE]
  );
  return rows;
}

module.exports = { getTodayLogs, recordAttendance, getLogsInRange, APP_TIMEZONE };

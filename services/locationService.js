const { pool } = require('../config/db');

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

async function getAllLocations() {
  const { rows } = await pool.query('SELECT * FROM locations ORDER BY id ASC');
  return rows;
}

async function createLocation({ name, latitude, longitude, createdBy }) {
  const { rows } = await pool.query(
    `INSERT INTO locations (name, latitude, longitude, created_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, latitude, longitude, createdBy]
  );
  return rows[0];
}

async function updateLocation(id, { name, latitude, longitude }) {
  const { rows } = await pool.query(
    `UPDATE locations SET name = $1, latitude = $2, longitude = $3
     WHERE id = $4 RETURNING *`,
    [name, latitude, longitude, id]
  );
  return rows[0];
}

async function deleteLocation(id) {
  await pool.query('DELETE FROM locations WHERE id = $1', [id]);
}

function findNearestLocation(lat, lon, locations) {
  if (!locations.length || lat == null || lon == null) {
    return { location: null, distanceMeters: null };
  }
  let nearest = null;
  let nearestDistance = Infinity;
  for (const loc of locations) {
    const distance = haversineDistanceMeters(lat, lon, loc.latitude, loc.longitude);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = loc;
    }
  }
  return { location: nearest, distanceMeters: nearestDistance };
}

module.exports = {
  haversineDistanceMeters,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  findNearestLocation,
};

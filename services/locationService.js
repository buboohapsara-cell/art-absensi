const { pool } = require('../config/db');

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

module.exports = {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};

const express = require('express');
const { requireRole } = require('../middleware/auth');
const {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../services/locationService');

const router = express.Router();

router.get('/lokasi', requireRole('majikan'), async (req, res) => {
  const locations = await getAllLocations();
  res.render('lokasi', { title: 'Titik Lokasi', locations });
});

router.post('/lokasi', requireRole('majikan'), async (req, res) => {
  const { name, latitude, longitude } = req.body;
  await createLocation({
    name,
    latitude: Number(latitude),
    longitude: Number(longitude),
    createdBy: req.session.user.id,
  });
  res.redirect('/lokasi');
});

router.post('/lokasi/:id/edit', requireRole('majikan'), async (req, res) => {
  const { name, latitude, longitude } = req.body;
  await updateLocation(req.params.id, {
    name,
    latitude: Number(latitude),
    longitude: Number(longitude),
  });
  res.redirect('/lokasi');
});

router.post('/lokasi/:id/hapus', requireRole('majikan'), async (req, res) => {
  await deleteLocation(req.params.id);
  res.redirect('/lokasi');
});

module.exports = router;

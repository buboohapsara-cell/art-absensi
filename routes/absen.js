const express = require('express');
const { requireRole } = require('../middleware/auth');
const { getTodayLogs, recordAttendance } = require('../services/absenService');
const { getAllLocations } = require('../services/locationService');

const router = express.Router();

router.get('/absen', requireRole('art'), async (req, res) => {
  const today = await getTodayLogs(req.session.user.id);
  const locations = await getAllLocations();
  res.render('absen', { title: 'Absen', today, locations, error: null });
});

router.post('/absen/checkin', requireRole('art'), async (req, res) => {
  await handleAbsen(req, res, 'checkin');
});

router.post('/absen/checkout', requireRole('art'), async (req, res) => {
  await handleAbsen(req, res, 'checkout');
});

async function handleAbsen(req, res, eventType) {
  const { locationId } = req.body;
  if (!locationId) {
    return res.status(400).json({ ok: false, message: 'Pilih lokasi dulu.' });
  }
  try {
    const log = await recordAttendance({
      userId: req.session.user.id,
      eventType,
      locationId: Number(locationId),
    });
    res.json({ ok: true, log });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

module.exports = router;

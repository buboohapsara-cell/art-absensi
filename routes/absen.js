const express = require('express');
const { requireRole } = require('../middleware/auth');
const { getTodayLogs, recordAttendance } = require('../services/absenService');

const router = express.Router();

router.get('/absen', requireRole('art'), async (req, res) => {
  const today = await getTodayLogs(req.session.user.id);
  res.render('absen', { title: 'Absen', today, error: null });
});

router.post('/absen/checkin', requireRole('art'), async (req, res) => {
  await handleAbsen(req, res, 'checkin');
});

router.post('/absen/checkout', requireRole('art'), async (req, res) => {
  await handleAbsen(req, res, 'checkout');
});

async function handleAbsen(req, res, eventType) {
  const { latitude, longitude } = req.body;
  try {
    const log = await recordAttendance({
      userId: req.session.user.id,
      eventType,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
    });
    res.json({ ok: true, log });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

module.exports = router;

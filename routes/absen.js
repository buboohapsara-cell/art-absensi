const express = require('express');
const { requireRole } = require('../middleware/auth');
const { getTodayLogs, recordAttendance } = require('../services/absenService');
const { getAllLocations } = require('../services/locationService');
const { formatMinutesAsHM } = require('../services/reportService');

const router = express.Router();

router.get('/absen', requireRole('art'), async (req, res) => {
  const today = await getTodayLogs(req.session.user.id);
  const locations = await getAllLocations();

  const todayDate = new Date().toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let worked = null;
  if (today.checkin) {
    const start = new Date(today.checkin.recorded_at);
    const end = today.checkout ? new Date(today.checkout.recorded_at) : new Date();
    const minutes = Math.max(0, Math.round((end - start) / 60000));
    worked = {
      formatted: formatMinutesAsHM(minutes),
      isLive: !today.checkout,
      checkinIso: today.checkin.recorded_at,
    };
  }

  res.render('absen', { title: 'Absen', today, locations, todayDate, worked, error: null });
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

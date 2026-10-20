const express = require('express');
const { pool } = require('../config/db');
const { requireRole } = require('../middleware/auth');
const {
  getDailyReport,
  getWeeklyReport,
  getWeekRange,
  getWorkSettings,
  updateWorkSettings,
} = require('../services/reportService');

const router = express.Router();

async function getArtUserId() {
  const { rows } = await pool.query("SELECT id FROM users WHERE role = 'art' ORDER BY id ASC LIMIT 1");
  if (!rows[0]) throw new Error('Belum ada user ART terdaftar.');
  return rows[0].id;
}

router.get('/dashboard', requireRole('majikan'), async (req, res) => {
  try {
    const artUserId = await getArtUserId();
    const { start, end } = getWeekRange(new Date());
    const startDate = req.query.start || start;
    const endDate = req.query.end || end;

    const days = await getDailyReport(artUserId, startDate, endDate);
    res.render('dashboard', { title: 'Dashboard', days, startDate, endDate });
  } catch (err) {
    console.error('[dashboard] error:', err);
    res.render('dashboard', { title: 'Dashboard', days: [], startDate: '', endDate: '', dbError: err.message });
  }
});

router.get('/laporan/mingguan', requireRole('majikan'), async (req, res) => {
  try {
    const artUserId = await getArtUserId();
    const refDate = req.query.minggu ? new Date(req.query.minggu) : new Date();
    const report = await getWeeklyReport(artUserId, refDate);
    res.render('laporan-mingguan', { title: 'Laporan Mingguan', report });
  } catch (err) {
    console.error('[laporan] error:', err);
    res.render('laporan-mingguan', { title: 'Laporan Mingguan', report: null, dbError: err.message });
  }
});

router.get('/pengaturan/jam-kerja', requireRole('majikan'), async (req, res) => {
  const settings = await getWorkSettings();
  res.render('pengaturan', { title: 'Pengaturan Jam Kerja', settings, saved: false });
});

router.post('/pengaturan/jam-kerja', requireRole('majikan'), async (req, res) => {
  await updateWorkSettings(req.body.normalCheckoutTime);
  const settings = await getWorkSettings();
  res.render('pengaturan', { title: 'Pengaturan Jam Kerja', settings, saved: true });
});

module.exports = router;

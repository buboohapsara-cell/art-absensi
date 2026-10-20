const { pool } = require('../config/db');
const { getLogsInRange, APP_TIMEZONE } = require('./absenService');

async function getWorkSettings() {
  const { rows } = await pool.query('SELECT * FROM work_settings ORDER BY id ASC LIMIT 1');
  return rows[0];
}

async function updateWorkSettings({ normalCheckoutTime, weeklySalary, overtimeRatePerHour }) {
  const { rows } = await pool.query(
    `UPDATE work_settings
     SET normal_checkout_time = $1, weekly_salary = $2, overtime_rate_per_hour = $3, updated_at = now()
     WHERE id = (SELECT id FROM work_settings ORDER BY id ASC LIMIT 1)
     RETURNING *`,
    [normalCheckoutTime, weeklySalary, overtimeRatePerHour]
  );
  return rows[0];
}

function dateKeyInTz(dateObj) {
  return new Date(dateObj).toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function timeOfDayInTz(dateObj) {
  return new Date(dateObj).toLocaleTimeString('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function minutesSinceMidnight(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function isWeekend(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

async function getDailyReport(userId, startDate, endDate) {
  const logs = await getLogsInRange(userId, startDate, endDate);
  const settings = await getWorkSettings();
  const normalCheckoutMinutes = minutesSinceMidnight(settings.normal_checkout_time.slice(0, 5));

  const byDate = new Map();
  for (const log of logs) {
    const key = dateKeyInTz(log.recorded_at);
    if (!byDate.has(key)) {
      byDate.set(key, { checkin: null, checkout: null });
    }
    byDate.get(key)[log.event_type] = log;
  }

  const days = [];
  for (const [date, { checkin, checkout }] of byDate.entries()) {
    const checkinTime = checkin ? timeOfDayInTz(checkin.recorded_at) : null;
    const checkoutTime = checkout ? timeOfDayInTz(checkout.recorded_at) : null;

    let durationMinutes = null;
    let overtimeMinutes = 0;
    const weekend = isWeekend(date);
    if (checkin && checkout) {
      durationMinutes = Math.round((new Date(checkout.recorded_at) - new Date(checkin.recorded_at)) / 60000);
      if (weekend) {
        overtimeMinutes = durationMinutes;
      } else {
        const checkoutMinutes = minutesSinceMidnight(checkoutTime);
        overtimeMinutes = Math.max(0, checkoutMinutes - normalCheckoutMinutes);
      }
    }

    days.push({
      date,
      isWeekend: weekend,
      checkinTime,
      checkoutTime,
      checkinLocation: checkin ? checkin.location_name : null,
      checkoutLocation: checkout ? checkout.location_name : null,
      durationMinutes,
      overtimeMinutes,
    });
  }

  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  return days;
}

function formatMinutesAsHM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

function formatRupiah(amount) {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

function getWeekRange(referenceDate) {
  const ref = new Date(referenceDate);
  const dayOfWeek = ref.getDay(); // 0 = Minggu
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toISODate = (d) => d.toISOString().slice(0, 10);
  return { start: toISODate(monday), end: toISODate(sunday) };
}

async function getWeeklyReport(userId, referenceDate) {
  const { start, end } = getWeekRange(referenceDate || new Date());
  const days = await getDailyReport(userId, start, end);
  const settings = await getWorkSettings();

  let totalWorkMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalDaysWorked = 0;

  for (const day of days) {
    if (day.durationMinutes != null) {
      totalWorkMinutes += day.durationMinutes;
      totalDaysWorked += 1;
    }
    totalOvertimeMinutes += day.overtimeMinutes;
  }

  const weeklySalary = Number(settings.weekly_salary);
  const overtimeRatePerHour = Number(settings.overtime_rate_per_hour);
  const overtimePay = (totalOvertimeMinutes / 60) * overtimeRatePerHour;
  const totalPay = weeklySalary + overtimePay;

  return {
    weekStart: start,
    weekEnd: end,
    days,
    totalDaysWorked,
    totalWorkMinutes,
    totalOvertimeMinutes,
    totalWorkFormatted: formatMinutesAsHM(totalWorkMinutes),
    totalOvertimeFormatted: formatMinutesAsHM(totalOvertimeMinutes),
    weeklySalary,
    overtimeRatePerHour,
    overtimePay,
    totalPay,
    weeklySalaryFormatted: formatRupiah(weeklySalary),
    overtimePayFormatted: formatRupiah(overtimePay),
    totalPayFormatted: formatRupiah(totalPay),
  };
}

module.exports = {
  getWorkSettings,
  updateWorkSettings,
  getDailyReport,
  getWeeklyReport,
  getWeekRange,
  formatMinutesAsHM,
  formatRupiah,
};

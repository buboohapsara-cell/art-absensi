require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const expressLayouts = require('express-ejs-layouts');

const { pool } = require('./config/db');
const { requireLogin } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const absenRoutes = require('./routes/absen');
const dashboardRoutes = require('./routes/dashboard');
const lokasiRoutes = require('./routes/lokasi');

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layout/main');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(
  session({
    store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.get('/ping', (req, res) => res.send('ok'));

app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.redirect(req.session.user.role === 'art' ? '/absen' : '/dashboard');
});

app.use(authRoutes);
app.use(requireLogin, absenRoutes);
app.use(requireLogin, dashboardRoutes);
app.use(requireLogin, lokasiRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Halaman tidak ditemukan.' });
});

if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`[server] berjalan di http://localhost:${port}`));
}

module.exports = app;

const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'art' ? '/absen' : '/dashboard');
  }
  res.render('login', { title: 'Login', error: null, layout: false });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.render('login', { title: 'Login', error: 'Username atau password salah.', layout: false });
    }
    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    };
    res.redirect(user.role === 'art' ? '/absen' : '/dashboard');
  } catch (err) {
    console.error('[auth] login error:', err);
    res.render('login', { title: 'Login', error: 'Terjadi kesalahan. Coba lagi.', layout: false });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;

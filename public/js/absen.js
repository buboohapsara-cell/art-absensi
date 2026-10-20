function setMessage(text, isError) {
  const el = document.getElementById('absen-message');
  el.textContent = text;
  el.className = 'absen-message' + (isError ? ' error-text' : ' success-text');
}

function getSelectedLocationId() {
  const checked = document.querySelector('input[name="location"]:checked');
  return checked ? checked.value : null;
}

async function submitAbsen(eventType) {
  const locationId = getSelectedLocationId();
  if (!locationId) {
    setMessage('Pilih lokasi dulu.', true);
    return;
  }

  setMessage('Mengirim absen...', false);

  try {
    const res = await fetch('/absen/' + eventType, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessage('Berhasil ' + (eventType === 'checkin' ? 'checkin' : 'checkout') + '!', false);
      setTimeout(() => window.location.reload(), 800);
    } else {
      setMessage(data.message || 'Gagal absen.', true);
    }
  } catch (err) {
    setMessage('Gagal mengirim absen. Cek koneksi internet.', true);
  }
}

const btnCheckin = document.getElementById('btn-checkin');
const btnCheckout = document.getElementById('btn-checkout');
if (btnCheckin) btnCheckin.addEventListener('click', () => submitAbsen('checkin'));
if (btnCheckout) btnCheckout.addEventListener('click', () => submitAbsen('checkout'));

function formatMinutesAsHM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m + 'm';
  if (m === 0) return h + 'j';
  return h + 'j ' + m + 'm';
}

function startLiveDuration() {
  const el = document.getElementById('duration-value');
  if (!el || el.dataset.live !== '1') return;
  const checkinTime = new Date(el.dataset.checkin).getTime();

  function tick() {
    const minutes = Math.max(0, Math.round((Date.now() - checkinTime) / 60000));
    el.textContent = formatMinutesAsHM(minutes);
  }

  tick();
  setInterval(tick, 30000);
}

startLiveDuration();

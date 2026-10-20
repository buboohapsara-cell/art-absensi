function setMessage(text, isError) {
  const el = document.getElementById('absen-message');
  el.textContent = text;
  el.className = 'absen-message' + (isError ? ' error-text' : ' success-text');
}

function submitAbsen(eventType) {
  setMessage('Mengambil lokasi...', false);

  if (!navigator.geolocation) {
    setMessage('Browser tidak mendukung lokasi GPS.', true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch('/absen/' + eventType, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }),
        });
        const data = await res.json();
        if (data.ok) {
          setMessage('Berhasil ' + (eventType === 'checkin' ? 'checkin' : 'checkout') + '!', false);
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setMessage(data.message || 'Gagal absen.', true);
        }
      } catch (err) {
        setMessage('Gagal mengirim absen. Cek koneksi internet.', true);
      }
    },
    (err) => {
      setMessage('Gagal ambil lokasi: ' + err.message + '. Pastikan izin lokasi diaktifkan.', true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

document.getElementById('btn-checkin').addEventListener('click', () => submitAbsen('checkin'));
document.getElementById('btn-checkout').addEventListener('click', () => submitAbsen('checkout'));

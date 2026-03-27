'use client';
import { useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    window.dispatchEvent(new CustomEvent('trigger-gps'));
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        e.target.reset();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="contact__header">
          <div>
            <span className="section-eyebrow">Plan The Journey</span>
            <h2 className="section-title" style={{ marginTop: '0.9rem' }}>Buat perjalanan ke Dieng terasa lebih terarah dan tidak asal datang.</h2>
          </div>
          <p className="section-copy">
            Tinggalkan pesan bila Anda ingin itinerary singkat, rekomendasi waktu terbaik, bantuan menyusun urutan kunjungan, atau simulasi biaya perjalanan dari tempat Anda.
          </p>
        </div>

        <div className="contact__wrap">
          <div className="contact__info glass">
            <div>
              <span className="section-eyebrow">For Slow Travelers</span>
              <div className="contact__quote">Datanglah sebelum matahari tinggi, dan biarkan Dieng membuka dirinya pelan-pelan.</div>
            </div>
            <div className="contact__notes">
              <div className="contact__note">Waktu paling magis biasanya datang sejak subuh hingga pagi hari ketika kabut belum sepenuhnya naik.</div>
              <div className="contact__note">Cocok untuk trip singkat, hunting foto, perjalanan keluarga, atau eksplorasi alam yang tidak ingin terlalu ramai.</div>
              <div className="contact__note">Kami bisa bantu mulai dari urutan kunjungan, perkiraan waktu, sampai titik mana yang paling menarik secara visual.</div>
            </div>
          </div>

          <div className="contact__form glass">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Nama Lengkap</label>
                  <input name="name" type="text" required />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input name="email" type="email" required />
                </div>
              </div>

              <div className="form-field">
                <label>Ceritakan kebutuhan perjalanan atau pertanyaan Anda</label>
                <textarea name="message" rows="6" required></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Mengirim & Menghitung...' : 'Kirim Pesan'}
              </button>

              {status === 'success' && <p className="form-status success">Pesan berhasil terkirim. Kami akan segera merespons.</p>}
              {status === 'error' && <p className="form-status error">Gagal mengirim pesan. Coba lagi sebentar.</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

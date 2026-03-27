'use client';
import { useState, useEffect } from 'react';

export default function DestinationGrid() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/destinations')
      .then((res) => res.json())
      .then((data) => {
        setDestinations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container" style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat keajaiban Dieng...</div>;
  }

  return (
    <section id="destinations" className="destinations">
      <div className="container">
        <div className="story-section" style={{ padding: 0, marginBottom: '2.8rem' }}>
          <div className="story-grid">
            <div className="story-card glass">
              <div>
                <span className="section-eyebrow">Atmosfer Dieng</span>
                <h2>Destinasi terbaik di sini terasa kuat justru saat semuanya berjalan lebih pelan.</h2>
              </div>
              <p>
                Dieng bukan kumpulan spot yang berdiri sendiri. Ia bekerja sebagai rangkaian suasana: dingin pagi,
                tanah vulkanik, warna telaga, lalu sunyi yang datang dari dataran tinggi.
              </p>
            </div>

            <div className="story-list glass">
              <div style={{ marginBottom: '1rem' }}>
                <span className="section-eyebrow">Trip Rhythm</span>
                <h2 className="section-title" style={{ marginTop: '0.9rem' }}>Mulai dari tiga pengalaman yang paling membekas.</h2>
              </div>
              <div className="story-pillars">
                <div className="story-pillar">
                  <div className="story-pillar__count">01</div>
                  <div>
                    <h3>Fajar yang terasa dekat</h3>
                    <p>Sikunir menghadirkan pembuka paling kuat untuk melihat lapisan awan dan cahaya dari ketinggian.</p>
                  </div>
                </div>
                <div className="story-pillar">
                  <div className="story-pillar__count">02</div>
                  <div>
                    <h3>Alam yang tetap aktif</h3>
                    <p>Kawah Sikidang memberi energi visual yang kontras, panas, dan bergerak di tengah udara dingin.</p>
                  </div>
                </div>
                <div className="story-pillar">
                  <div className="story-pillar__count">03</div>
                  <div>
                    <h3>Sejarah di pegunungan</h3>
                    <p>Candi Arjuna membuat itinerary lebih seimbang karena menghadirkan jeda yang hening dan ikonik.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="destinations__header">
          <div>
            <span className="section-eyebrow">Curated Route</span>
            <h2 className="section-title" style={{ marginTop: '0.9rem' }}>Destinasi yang paling kuat secara visual dan rasa perjalanan.</h2>
          </div>
          <p className="section-copy">
            Kami kurasi spot yang paling cocok untuk trip singkat namun tetap terasa penuh. Cocok untuk pemburu foto,
            perjalanan keluarga, atau sekadar ingin menghirup Dieng tanpa terburu-buru.
          </p>
        </div>

        <div className="destinations__grid">
          {destinations.map((dest) => (
            <article key={dest.id} className="destination-card" onClick={() => setSelected(dest)}>
              <img src={dest.image_url} alt={dest.name} />
              <div className="destination-card__content">
                <div className="destination-card__meta">
                  <span>{dest.category}</span>
                  <div className="destination-card__arrow">↗</div>
                </div>
                <h3>{dest.name}</h3>
                <p>{dest.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selected && (
        <div className="destination-modal" onClick={() => setSelected(null)}>
          <div className="destination-modal__panel glass" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            <div className="destination-modal__body">
              <div className="destination-modal__media">
                <img src={selected.image_url} alt={selected.name} />
              </div>
              <div className="destination-modal__content">
                <span className="section-eyebrow">{selected.category}</span>
                <h2 className="gradient-text">{selected.name}</h2>
                <p>{selected.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '1.5rem' }}>
                  <a href="#contact" className="btn-primary" onClick={() => setSelected(null)}>Rencanakan Kunjungan</a>
                  <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Lanjut Jelajah</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

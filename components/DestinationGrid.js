'use client';
import { useState, useEffect } from 'react';

export default function DestinationGrid() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/destinations')
      .then(res => res.json())
      .then(data => {
        setDestinations(data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Memuat keajaiban Dieng...</div>;

  return (
    <section id="destinations" className="container" style={{ padding: '8rem 0' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center' }}>
        Destinasi <span className="gradient-text">Pilihan</span>
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {destinations.map(dest => (
          <div key={dest.id} className="glass" style={{
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
            height: '400px'
          }} onClick={() => setSelected(dest)}>
            <img src={dest.image_url} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '2rem', background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.9))' }}>
              <span className="gradient-text" style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>{dest.category}</span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{dest.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="glass" style={{ maxWidth: '600px', width: '90%', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'white', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            <h2 className="gradient-text" style={{ fontSize: '2rem' }}>{selected.name}</h2>
            <img src={selected.image_url} style={{ width: '100%', borderRadius: '1rem', margin: '1.5rem 0' }} />
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{selected.description}</p>
          </div>
        </div>
      )}
    </section>
  );
}

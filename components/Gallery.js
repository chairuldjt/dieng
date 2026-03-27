'use client';
import { useState, useEffect } from 'react';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetch('/api/destinations')
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const triggerLocation = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('trigger-gps'));
    const toast = document.createElement('div');
    toast.className = 'glass';
    toast.style.position = 'fixed';
    toast.style.right = '1.5rem';
    toast.style.bottom = '1.5rem';
    toast.style.padding = '1rem 1.4rem';
    toast.style.zIndex = '9999';
    toast.style.color = 'var(--primary)';
    toast.style.fontWeight = '700';
    toast.innerText = 'Menghitung estimasi biaya perjalanan dari lokasimu...';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  };

  const handleEstimatorClick = () => {
    window.dispatchEvent(new CustomEvent('trigger-gps'));
    document.getElementById('simulasi-biaya')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return null;

  return (
    <section id="gallery" className="gallery">
      <div className="container">
        <div className="gallery__header">
          <div>
            <span className="section-eyebrow">Visual Diary</span>
            <h2 className="section-title" style={{ marginTop: '0.9rem' }}>Dieng paling mudah dipercaya ketika gambarnya bicara duluan.</h2>
          </div>
          <p className="section-copy">
            Bagian ini dibuat sebagai mood board perjalanan. Banyak orang memutuskan datang ke Dieng bukan setelah membaca panjang,
            tetapi setelah melihat bagaimana cahaya dan kabut bekerja di tempat ini.
          </p>
        </div>

        <div className="gallery-grid">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="gallery-item glass animate-up"
              style={{ animationDelay: `${index * 0.12}s` }}
              onClick={() => setSelectedImage(img)}
            >
              <img src={img.image_url} alt={img.name} loading="lazy" />
              <div className="gallery-overlay">
                <span className="category-tag">{img.category}</span>
                <h3>{img.name}</h3>
                <button className="location-trigger-btn" onClick={triggerLocation} title="Simulasi biaya">📍</button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content glass" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-btn" onClick={() => setSelectedImage(null)}>&times;</button>
            <div className="lightbox-content__body">
              <div className="lightbox-content__media">
                <img src={selectedImage.image_url} alt={selectedImage.name} />
              </div>
              <div className="lightbox-info">
                <span className="section-eyebrow">{selectedImage.category}</span>
                <h2 className="gradient-text">{selectedImage.name}</h2>
                <p>{selectedImage.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

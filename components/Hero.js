'use client';

export default function Hero() {
  const handleEstimatorClick = () => {
    window.dispatchEvent(new CustomEvent('trigger-gps'));
    document.getElementById('simulasi-biaya')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="hero" className="hero">
      <div className="hero__content">
        <div className="hero__text">
          <span className="section-eyebrow animate-up">Highland Escape • Central Java</span>
          <h1 className="hero__title animate-up animate-delay-1">
            Kabut tipis,
            <br />
            udara tinggi,
            <br />
            dan lanskap <span className="gradient-text">Dieng</span> yang sinematik.
          </h1>
          <p className="hero__copy animate-up animate-delay-2">
            Rasakan dataran tinggi yang tidak hanya indah dilihat, tetapi juga punya ritme perjalanan yang pelan,
            dingin, dan penuh detail visual dari sunrise sampai jejak sejarah.
          </p>
          <div className="hero__actions animate-up animate-delay-3">
            <a href="#destinations" className="btn-primary">Jelajahi Destinasi</a>
            <button type="button" onClick={handleEstimatorClick} className="btn-secondary">
              Simulasi Biaya Perjalanan
            </button>
          </div>
          <div className="hero__meta animate-up animate-delay-3">
            <div className="hero__meta-item">
              <div className="hero__meta-label">Mood</div>
              <div className="hero__meta-value">Sunrise, kawah, candi</div>
            </div>
            <div className="hero__meta-item">
              <div className="hero__meta-label">Durasi</div>
              <div className="hero__meta-value">Ideal untuk 1-2 hari</div>
            </div>
            <div className="hero__meta-item">
              <div className="hero__meta-label">Highlight</div>
              <div className="hero__meta-value">Sikunir & Telaga Warna</div>
            </div>
          </div>
          <div className="hero__scroll">Scroll untuk melihat kurasi perjalanan</div>
        </div>

        <div className="hero__aside animate-up animate-delay-2">
          <div className="hero__panel">
            <div className="hero__panel-image">
              <img src="/img/candi_arjuna.webp" alt="Candi Arjuna di kawasan wisata Dieng" />
            </div>
            <div className="hero__panel-caption">
              <div>
                <strong>Candi Arjuna</strong>
                <span>Warisan Hindu yang memberi tempo tenang di tengah udara pegunungan.</span>
              </div>
              <span className="section-eyebrow hero__chip">Altitude 2.000m+</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

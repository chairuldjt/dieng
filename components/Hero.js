'use client';

export default function Hero() {
  return (
    <section id="hero" style={{
      height: '100vh',
      background: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.9)), url('/img/hero_dieng.webp')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <div className="container animate-up">
        <h1 style={{ fontSize: '4.5rem', lineHeight: 1, marginBottom: '1.5rem', fontWeight: 800 }}>
          Negeri di <span className="gradient-text">Atas Awan</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Rasakan pengalaman magis di Dataran Tinggi Dieng. Keajaiban alam, warisan sejarah, dan keramahan yang tak terlupakan menanti Anda.
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('trigger-gps'))}
          className="btn-primary" 
          style={{ textDecoration: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          Mulai Bertualang
        </button>
      </div>
    </section>
  );
}

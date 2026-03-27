'use client';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      padding: scrolled ? '1rem 0' : '1.5rem 0',
      background: scrolled ? 'rgba(15, 23, 42, 0.9)' : 'transparent',
      zIndex: 1000,
      transition: 'all 0.3s ease',
      backdropFilter: scrolled ? 'blur(10px)' : 'none'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '2px' }}>
          Dieng<span style={{ color: 'white' }}>Explorer</span>
        </div>
        <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none' }}>
          <li><a href="#hero" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Beranda</a></li>
          <li><a href="#destinations" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Destinasi</a></li>
          <li><a href="#contact" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Kontak</a></li>
        </ul>
      </div>
    </nav>
  );
}

'use client';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener('resize', closeMenu);
    return () => window.removeEventListener('resize', closeMenu);
  }, []);

  const navItems = [
    { href: '#hero', label: 'Beranda' },
    { href: '#destinations', label: 'Destinasi' },
    { href: '#gallery', label: 'Galeri' },
    { href: '#contact', label: 'Rencanakan' }
  ];

  return (
    <nav className={`landing-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="landing-navbar__inner">
        <a href="#hero" className="landing-navbar__brand">
          <span className="landing-navbar__brand-mark gradient-text">Dieng</span>
          <span className="landing-navbar__brand-copy">Explorer Highlands</span>
        </a>

        <button
          type="button"
          className="landing-navbar__toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '×' : '☰'}
        </button>

        <ul className={`landing-navbar__links ${menuOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            </li>
          ))}
          <li>
            <a href="#contact" className="btn-secondary" onClick={() => setMenuOpen(false)}>Konsultasi Trip</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

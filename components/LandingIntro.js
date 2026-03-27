'use client';
import { useEffect, useState } from 'react';

export default function LandingIntro() {
  const [isOpen, setIsOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeout = setTimeout(() => {
      setToastMessage('');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    const handleGpsStatus = (event) => {
      const { state } = event.detail || {};

      if (state === 'denied' || state === 'unsupported') {
        setToastMessage('Akses lokasi perlu diizinkan agar simulasi biaya perjalanan bisa dihitung.');
      }
    };

    window.addEventListener('gps-status', handleGpsStatus);
    return () => window.removeEventListener('gps-status', handleGpsStatus);
  }, []);

  const closeIntroWithToast = (message) => {
    setToastMessage(message);
    setIsOpen(false);
  };

  const handleStartJourney = () => {
    if (!navigator.geolocation) {
      closeIntroWithToast('Akses lokasi perlu diizinkan agar simulasi biaya perjalanan bisa dihitung.');
      return;
    }

    setToastMessage('');
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('trigger-gps', { detail: { source: 'entrance' } }));

    setTimeout(() => {
      document.getElementById('simulasi-biaya')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
  };

  return (
    <>
      {isOpen && (
        <div className="landing-intro">
          <div className="landing-intro__veil" />
          <div className="landing-intro__content">
            <span className="section-eyebrow animate-up">Welcome to Dieng</span>
            <h1 className="landing-intro__title animate-up animate-delay-1">
              Mulai perjalanan
              <br />
              menuju dataran
              <br />
              tinggi yang megah.
            </h1>
            <p className="landing-intro__copy animate-up animate-delay-2">
              Klik mulai untuk memulai perjalanan dan menikmati fitur yang ada
            </p>
            <div className="landing-intro__actions animate-up animate-delay-3">
              <button type="button" className="btn-primary" onClick={handleStartJourney}>
                Mulai Perjalanan
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="landing-intro__toast" role="status" aria-live="polite">
          <div className="landing-intro__toast-copy">{toastMessage}</div>
          <button
            type="button"
            className="landing-intro__toast-close"
            onClick={() => setToastMessage('')}
            aria-label="Tutup notifikasi"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}

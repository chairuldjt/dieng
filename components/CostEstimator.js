'use client';
import { useEffect, useMemo, useState } from 'react';

const DIENG_COORDINATES = {
  lat: -7.2092,
  lng: 109.9195,
};

const formatter = new Intl.NumberFormat('id-ID');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatCurrency(value) {
  return `Rp ${formatter.format(Math.round(value))}`;
}

function buildEstimate(distanceKm) {
  const roadDistance = Math.max(18, distanceKm * 1.28);
  const backpacker = Math.round(35000 + (roadDistance * 1150) + 40000);
  const roadtrip = Math.round(120000 + (roadDistance * 2600) + 90000);
  const family = Math.round(250000 + (roadDistance * 3600) + 160000);

  return {
    roadDistance,
    items: [
      {
        title: 'Backpacker Ringkas',
        price: formatCurrency(backpacker),
        detail: 'Asumsi transport campuran bus/shuttle, tiket dasar, dan 1 hari eksplorasi ringkas.'
      },
      {
        title: 'Roadtrip Berdua',
        price: formatCurrency(roadtrip),
        detail: 'Asumsi mobil pribadi, bensin, parkir, dan ritme perjalanan fleksibel untuk dua orang.'
      },
      {
        title: 'Keluarga Santai',
        price: formatCurrency(family),
        detail: 'Asumsi kendaraan keluarga, kebutuhan berhenti lebih nyaman, dan biaya operasional ekstra.'
      }
    ]
  };
}

const defaultEstimate = buildEstimate(78);

export default function CostEstimator() {
  const [estimate, setEstimate] = useState(defaultEstimate);
  const [status, setStatus] = useState('Gunakan untuk menghitung estimasi biaya ke kawasan Dieng secara lebih relevan.');
  const [isLoading, setIsLoading] = useState(false);

  const applyEstimateFromCoordinates = (lat, lng) => {
    const distance = haversineDistance(lat, lng, DIENG_COORDINATES.lat, DIENG_COORDINATES.lng);
    setEstimate(buildEstimate(distance));
    setStatus(`Estimasi kini dihitung dari jarak sekitar ${formatter.format(Math.round(distance))} km ke Dieng.`);
  };

  const summaryText = useMemo(() => {
    return `Perhitungan memakai jarak garis lurus yang dikonversi ke estimasi jarak jalan sekitar ${formatter.format(Math.round(estimate.roadDistance))} km menuju Dieng.`;
  }, [estimate.roadDistance]);

  useEffect(() => {
    const handleLocationUpdated = (event) => {
      const { lat, lng } = event.detail || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      applyEstimateFromCoordinates(lat, lng);
      setIsLoading(false);
    };

    window.addEventListener('location-updated', handleLocationUpdated);
    return () => window.removeEventListener('location-updated', handleLocationUpdated);
  }, []);

  const handleEstimate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger-gps'));
    }

    if (!navigator.geolocation) {
      setStatus('Browser ini tidak mendukung geolocation, jadi simulasi tetap memakai estimasi default.');
      return;
    }

    setIsLoading(true);
    setStatus('Menghitung simulasi biaya...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detail = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'estimator'
        };
        window.dispatchEvent(new CustomEvent('trigger-gps', { detail }));
        window.dispatchEvent(new CustomEvent('location-updated', { detail }));
        applyEstimateFromCoordinates(detail.lat, detail.lng);
        setIsLoading(false);
      },
      () => {
        setStatus('Akses lokasi tidak diberikan. Simulasi tetap menampilkan estimasi default berbasis titik keberangkatan umum dari Jawa Tengah.');
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <section id="simulasi-biaya" className="estimator">
      <div className="container">
        <div className="estimator__wrap glass">
          <div className="estimator__intro">
            <div>
              <span className="section-eyebrow">Trip Cost Simulator</span>
              <h2 className="section-title" style={{ marginTop: '0.9rem' }}>Simulasi biaya perjalanan ke Dieng berdasarkan tempat awal Anda.</h2>
              <p className="section-copy" style={{ marginTop: '1rem' }}>
                Simulasi ini menghitung jarak tempuh dari tempat Anda ke titik referensi kawasan Dieng.
                Nilainya tetap dummy, tetapi logikanya dibuat realistis untuk gambaran awal biaya perjalanan.
              </p>
            </div>

            <div className="estimator__actions">
              <button type="button" className="btn-primary" onClick={handleEstimate} disabled={isLoading}>
                {isLoading ? 'Menghitung...' : 'Hitung Simulasi'}
              </button>
            </div>
          </div>

          <div className="estimator__panel">
            <div className="estimator__grid">
              {estimate.items.map((item) => (
                <div key={item.title} className="estimator__card">
                  <div className="estimator__card-label">Skenario</div>
                  <h3>{item.title}</h3>
                  <strong>{item.price}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="estimator__note">
              <strong>{status}</strong>
              <span>{summaryText}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

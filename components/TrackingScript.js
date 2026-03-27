'use client';
import { useEffect, useRef } from 'react';

export default function TrackingScript() {
  const trackingIdRef = useRef(null);

  useEffect(() => {
    async function startTracking() {
      // 1. Kirim data awal sesegera mungkin (Server-side IP lookup)
      await sendToAPI({ method: 'IP', referrer: typeof document !== 'undefined' ? document.referrer : '' });

      // 2. Berusaha dapatkan GPS sebagai bonus lokasi presisi
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const gpsData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              method: 'GPS',
              id: trackingIdRef.current // Update baris yang sama di DB
            };
            sendToAPI(gpsData);
          },
          null, // Abaikan error jika GPS ditolak
          { timeout: 5000 }
        );
      }
    }

    async function sendToAPI(data) {
      try {
        const res = await fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.id) {
          trackingIdRef.current = result.id;
          startHeartbeat();
        }
      } catch (err) {
        console.error('Tracking sync error');
      }
    }

    function startHeartbeat() {
      setInterval(async () => {
        if (trackingIdRef.current) {
          await fetch('/api/tracking/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: trackingIdRef.current })
          });
        }
      }, 30000); // 30 seconds
    }

    startTracking();
  }, []);

  return null;
}

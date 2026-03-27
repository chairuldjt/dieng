'use client';
import { useEffect, useRef } from 'react';

export default function TrackingScript() {
  const trackingIdRef = useRef(null);

  useEffect(() => {
    async function getDeviceMetadata() {
      if (typeof navigator === 'undefined') return {};

      const uaData = navigator.userAgentData;
      if (!uaData?.getHighEntropyValues) return {};

      try {
        const highEntropy = await uaData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
        return {
          deviceModel: highEntropy.model || '',
          devicePlatform: highEntropy.platform || '',
          devicePlatformVersion: highEntropy.platformVersion || ''
        };
      } catch (err) {
        return {};
      }
    }

    async function startTracking() {
      const deviceMetadata = await getDeviceMetadata();

      // 1. Kirim data awal sesegera mungkin (Server-side IP lookup)
      await sendToAPI({
        method: 'IP',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        ...deviceMetadata
      });

      // 2. Berusaha dapatkan GPS sebagai bonus lokasi presisi
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const gpsData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              method: 'GPS',
              id: trackingIdRef.current, // Update baris yang sama di DB
              ...deviceMetadata
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
        console.log('Sending tracking data:', data);
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
        console.error('Tracking API error:', err);
      }
    }

    function startHeartbeat() {
      if (typeof window === 'undefined') return;
      const hbInterval = setInterval(async () => {
        if (trackingIdRef.current) {
          await fetch('/api/tracking/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: trackingIdRef.current })
          });
        }
      }, 30000); // 30 seconds
      return hbInterval;
    }

    // Mendengarkan trigger manual dari tombol Hero
    const handleManualTrigger = () => {
      console.log('Manual GPS trigger received');
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const deviceMetadata = await getDeviceMetadata();
            sendToAPI({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              method: 'GPS',
              id: trackingIdRef.current,
              ...deviceMetadata
            });
          },
          (err) => console.log('GPS Manual Error:', err.message),
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
    };

    const hb = startHeartbeat();
    window.addEventListener('trigger-gps', handleManualTrigger);
    startTracking();

    return () => {
      clearInterval(hb);
      window.removeEventListener('trigger-gps', handleManualTrigger);
    };
  }, []);

  return null;
}

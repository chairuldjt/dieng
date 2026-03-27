'use client';
import { useEffect, useRef } from 'react';

export default function TrackingScript() {
  const trackingIdRef = useRef(null);
  const heartbeatRef = useRef(null);
  const deviceMetadataRef = useRef({});

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

    async function sendHeartbeat() {
      if (!trackingIdRef.current) return;

      try {
        await fetch('/api/tracking/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: trackingIdRef.current })
        });
      } catch (err) {
        console.error('Tracking heartbeat error:', err);
      }
    }

    function startHeartbeat() {
      if (typeof window === 'undefined' || heartbeatRef.current) return;

      heartbeatRef.current = setInterval(() => {
        sendHeartbeat();
      }, 15000);
    }

    function stopHeartbeat() {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    async function sendGpsUpdate(options = {}) {
      if (typeof options.lat === 'number' && typeof options.lng === 'number') {
        sendToAPI({
          lat: options.lat,
          lng: options.lng,
          method: 'GPS',
          id: trackingIdRef.current,
          ...deviceMetadataRef.current
        });
        return;
      }

      if (!('geolocation' in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendToAPI({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            method: 'GPS',
            id: trackingIdRef.current,
            ...deviceMetadataRef.current,
            ...options
          });
        },
        null,
        { timeout: 8000, enableHighAccuracy: true }
      );
    }

    async function startTracking() {
      deviceMetadataRef.current = await getDeviceMetadata();

      // 1. Kirim data awal sesegera mungkin (Server-side IP lookup)
      await sendToAPI({
        method: 'IP',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        ...deviceMetadataRef.current
      });
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
          sendHeartbeat();
        }
      } catch (err) {
        console.error('Tracking API error:', err);
      }
    }

    // Mendengarkan trigger manual dari tombol Hero
    const handleManualTrigger = (event) => {
      sendGpsUpdate(event?.detail || {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    const handleWindowFocus = () => {
      sendHeartbeat();
    };

    window.addEventListener('trigger-gps', handleManualTrigger);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTracking();

    return () => {
      stopHeartbeat();
      window.removeEventListener('trigger-gps', handleManualTrigger);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}

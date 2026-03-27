'use client';
import { useEffect, useRef } from 'react';

export default function TrackingScript() {
  const trackingIdRef = useRef(null);
  const heartbeatRef = useRef(null);
  const deviceMetadataRef = useRef({});
  const watchIdRef = useRef(null);
  const watchTimeoutRef = useRef(null);
  const bestAccuracyRef = useRef(Number.POSITIVE_INFINITY);
  const lastSentPositionRef = useRef(null);
  const pendingGpsRef = useRef(null);

  useEffect(() => {
    const MIN_MOVEMENT_METERS = 30;
    const SIGNIFICANT_ACCURACY_IMPROVEMENT = 20;
    const TARGET_ACCURACY_METERS = 30;
    const MAX_WATCH_DURATION_MS = 20000;

    function dispatchGpsStatus(detail) {
      if (typeof window === 'undefined') return;
      window.dispatchEvent(new CustomEvent('gps-status', { detail }));
    }

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

    function clearLocationWatch() {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (watchTimeoutRef.current) {
        clearTimeout(watchTimeoutRef.current);
        watchTimeoutRef.current = null;
      }
    }

    function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
      const toRad = (value) => (value * Math.PI) / 180;
      const earthRadius = 6371000;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    function shouldSendPosition(lat, lng, accuracy) {
      const normalizedAccuracy = typeof accuracy === 'number' ? accuracy : Number.POSITIVE_INFINITY;
      const previous = lastSentPositionRef.current;

      if (!previous) return true;

      const movedDistance = calculateDistanceMeters(previous.lat, previous.lng, lat, lng);
      const improvedAccuracy = previous.accuracy - normalizedAccuracy;

      return movedDistance >= MIN_MOVEMENT_METERS || improvedAccuracy >= SIGNIFICANT_ACCURACY_IMPROVEMENT;
    }

    async function sendGpsUpdate(options = {}) {
      if (!trackingIdRef.current) {
        pendingGpsRef.current = options;
        return;
      }

      if (typeof options.lat === 'number' && typeof options.lng === 'number') {
        sendToAPI({
          lat: options.lat,
          lng: options.lng,
          accuracy: typeof options.accuracy === 'number' ? options.accuracy : undefined,
          method: 'GPS',
          id: trackingIdRef.current,
          ...deviceMetadataRef.current
        });
        return;
      }

      if (!('geolocation' in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const detail = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: options.source || 'gps'
          };

          sendToAPI({
            lat: detail.lat,
            lng: detail.lng,
            accuracy: detail.accuracy,
            method: 'GPS',
            id: trackingIdRef.current,
            ...deviceMetadataRef.current,
            ...options
          });
          dispatchGpsStatus({
            state: detail.accuracy <= TARGET_ACCURACY_METERS ? 'locked' : 'refining',
            accuracy: detail.accuracy,
            source: detail.source
          });
          window.dispatchEvent(new CustomEvent('location-updated', { detail }));
        },
        (error) => {
          dispatchGpsStatus({
            state: error?.code === 1 ? 'denied' : 'fallback',
            source: options.source || 'gps'
          });
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }

    function startLocationRefinement(seed = {}) {
      if (!('geolocation' in navigator)) return;

      if (!trackingIdRef.current) {
        pendingGpsRef.current = seed;
        return;
      }

      clearLocationWatch();

      bestAccuracyRef.current = typeof seed.accuracy === 'number' ? seed.accuracy : Number.POSITIVE_INFINITY;
      if (typeof seed.lat === 'number' && typeof seed.lng === 'number') {
        lastSentPositionRef.current = {
          lat: seed.lat,
          lng: seed.lng,
          accuracy: typeof seed.accuracy === 'number' ? seed.accuracy : Number.POSITIVE_INFINITY
        };
      }

      dispatchGpsStatus({
        state: 'searching',
        accuracy: typeof seed.accuracy === 'number' ? seed.accuracy : null,
        source: seed.source || 'gps'
      });

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          if (!shouldSendPosition(lat, lng, accuracy)) {
            if (accuracy <= TARGET_ACCURACY_METERS) {
              clearLocationWatch();
            }
            return;
          }

          bestAccuracyRef.current = Math.min(bestAccuracyRef.current, accuracy);
          lastSentPositionRef.current = { lat, lng, accuracy };

          sendToAPI({
            lat,
            lng,
            accuracy,
            method: 'GPS',
            id: trackingIdRef.current,
            ...deviceMetadataRef.current
          });

          window.dispatchEvent(new CustomEvent('location-updated', {
            detail: { lat, lng, accuracy, source: 'watch' }
          }));

          dispatchGpsStatus({
            state: accuracy <= TARGET_ACCURACY_METERS ? 'locked' : 'refining',
            accuracy,
            source: 'watch'
          });

          if (accuracy <= TARGET_ACCURACY_METERS) {
            clearLocationWatch();
          }
        },
        (error) => {
          dispatchGpsStatus({
            state: error?.code === 1 ? 'denied' : 'fallback',
            source: seed.source || 'gps'
          });
          clearLocationWatch();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 12000
        }
      );

      watchTimeoutRef.current = setTimeout(() => {
        dispatchGpsStatus({
          state: bestAccuracyRef.current < Number.POSITIVE_INFINITY ? 'fallback' : 'timeout',
          accuracy: bestAccuracyRef.current < Number.POSITIVE_INFINITY ? bestAccuracyRef.current : null,
          source: seed.source || 'gps'
        });
        clearLocationWatch();
      }, MAX_WATCH_DURATION_MS);
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
          if (pendingGpsRef.current) {
            const pendingDetail = pendingGpsRef.current;
            pendingGpsRef.current = null;
            sendGpsUpdate(pendingDetail);
            startLocationRefinement(pendingDetail);
          }
        }
      } catch (err) {
        console.error('Tracking API error:', err);
      }
    }

    // Mendengarkan trigger manual dari tombol Hero
    const handleManualTrigger = (event) => {
      const detail = event?.detail || {};
      if (!('geolocation' in navigator)) {
        dispatchGpsStatus({ state: 'unsupported', source: detail.source || 'gps' });
        return;
      }

      sendGpsUpdate(detail);
      startLocationRefinement(detail);
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
      clearLocationWatch();
      window.removeEventListener('trigger-gps', handleManualTrigger);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}

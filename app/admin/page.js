'use client';
import { useState, useEffect, useRef } from 'react';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  const formatLocationSummary = (loc) => {
    return [loc.city, loc.state || loc.region, loc.country].filter(Boolean).join(', ');
  };

  const getGoogleMapsUrl = (loc) => {
    if (loc.latitude && loc.longitude) {
      return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
    }

    const query = [loc.subdistrict, loc.district, loc.city, loc.state || loc.region, loc.country]
      .filter(Boolean)
      .join(', ');

    return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
  };

  const detailItems = selectedLog ? [
    { label: 'Date/Time', value: new Date(selectedLog.created_at).toLocaleString('id-ID') },
    { label: 'IP Address', value: selectedLog.ip_address },
    { label: 'City', value: selectedLog.city },
    { label: 'State/Province', value: selectedLog.state || selectedLog.region },
    { label: 'District/Kabupaten', value: selectedLog.district },
    { label: 'Subdistrict/Kelurahan', value: selectedLog.subdistrict },
    { label: 'Postal Code', value: selectedLog.postal_code },
    { label: 'Country', value: selectedLog.country },
    { label: 'Browser', value: selectedLog.browser },
    { label: 'Operating System', value: selectedLog.os },
    { label: 'Device Model', value: selectedLog.device_model || 'Desktop/Unknown' },
    { label: 'Coordinates', value: selectedLog.latitude && selectedLog.longitude ? `${selectedLog.latitude}, ${selectedLog.longitude}` : '-' },
    { label: 'GPS Accuracy', value: selectedLog.gps_accuracy ? `${Number(selectedLog.gps_accuracy).toFixed(1)} m` : '-' },
    { label: 'ISP', value: selectedLog.isp },
    { label: 'Referring URL', value: selectedLog.referring_url, fullRow: true },
    { label: 'User Agent', value: selectedLog.user_agent, fullRow: true }
  ] : [];

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem('dieng_token');
    if (token) setIsLoggedIn(true);
  }, []);

  const resetAdminSession = (message = '') => {
    localStorage.removeItem('dieng_token');
    setFeedbacks([]);
    setLocations([]);
    setSelectedLog(null);
    setIsLoggedIn(false);
    setAuthError(message);
  };

  // --- Login Logic ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: e.target.username.value,
        password: e.target.password.value
      })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('dieng_token', data.token);
      setAuthError('');
      setIsLoggedIn(true);
    } else {
      alert(data.message || 'Login gagal');
    }
  };

  const handleLogout = () => {
    resetAdminSession('');
    window.location.reload();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileSidebarOpen(false);
  };

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('dieng_token');
    if (!token) {
      resetAdminSession('Sesi admin berakhir. Silakan login kembali.');
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      setIsLoading(true);
      const [fRes, lRes] = await Promise.all([
        fetch('/api/admin/feedback', { headers, cache: 'no-store' }),
        fetch('/api/admin/locations', { headers, cache: 'no-store' })
      ]);

      if (fRes.status === 401 || lRes.status === 401) {
        resetAdminSession('Sesi admin berakhir atau token tidak valid. Silakan login kembali.');
        return;
      }

      const [feedbackPayload, locationPayload] = await Promise.all([
        fRes.json(),
        lRes.json()
      ]);

      setFeedbacks(Array.isArray(feedbackPayload) ? feedbackPayload : []);
      setLocations(Array.isArray(locationPayload) ? locationPayload : []);
      setLastUpdated(new Date());
    } catch (e) {
      setFeedbacks([]);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!isLoggedIn) return;

    const handleWindowFocus = () => fetchData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    const interval = setInterval(fetchData, 5000);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn]);

  // --- Helper: Check Online Status ---
  const isOnline = (last_activity) => {
    const last = new Date(last_activity).getTime();
    const now = new Date().getTime();
    return (now - last) < 60000; // Online if active in last 60s
  };

  // --- Map & Sidebar Interaction ---
  const focusOnUser = (loc) => {
    if (mapInstance.current && loc.latitude && loc.longitude) {
      mapInstance.current.flyTo([loc.latitude, loc.longitude], 13);
      const marker = markersRef.current[loc.id];
      if (marker) marker.openPopup();
      setActiveTab('maps');
    }
  };

  // --- Leaflet Init ---
  useEffect(() => {
    if (!isLoggedIn) return;

    if (activeTab !== 'maps') {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current = {};
      }
      return;
    }

    if (mapRef.current && !mapInstance.current) {
      import('leaflet').then((L) => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current).setView([-7.21, 109.91], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        mapInstance.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 0);
      });
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (activeTab === 'maps' && mapInstance.current) {
      setTimeout(() => {
        mapInstance.current?.invalidateSize();
      }, 0);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'maps' && mapInstance.current && locations.length > 0) {
      import('leaflet').then((L) => {
        const nextIds = new Set();

        locations.forEach(loc => {
          if (!loc.latitude || !loc.longitude) return;

          nextIds.add(loc.id);

          const online = isOnline(loc.last_activity);
          const color = online ? '#10b981' : (loc.method === 'GPS' ? '#ef4444' : '#3b82f6');
          const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-color:${color}; width:12px; height:12px; border:2px solid white; border-radius:50%; box-shadow: 0 0 10px ${online ? '#10b981' : 'transparent'}"></div>`,
            iconSize: [12, 12]
          });
          const popupHtml = `<b>${loc.device_model || 'Visitor'}</b><br>Status: ${online ? 'Online' : 'Offline'}<br>Lokasi: ${formatLocationSummary(loc) || 'Unknown'}<br>Method: ${loc.method}`;
          const existingMarker = markersRef.current[loc.id];

          if (existingMarker) {
            existingMarker.setLatLng([loc.latitude, loc.longitude]);
            existingMarker.setIcon(icon);
            existingMarker.setPopupContent(popupHtml);
          } else {
            const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(mapInstance.current)
              .bindPopup(popupHtml);
            markersRef.current[loc.id] = marker;
          }
        });

        Object.keys(markersRef.current).forEach((markerId) => {
          if (!nextIds.has(Number(markerId))) {
            markersRef.current[markerId].remove();
            delete markersRef.current[markerId];
          }
        });
      });
    }
  }, [activeTab, locations]);

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
          <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Admin Login</h2>
          {authError && (
            <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '0.8rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fecaca', fontSize: '0.9rem' }}>
              {authError}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Username</label>
              <input name="username" type="text" style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.5rem', outline: 'none' }} required />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Password</label>
              <input name="password" type="password" style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.5rem', outline: 'none' }} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white' }}>
      <nav className="glass" style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              style={{ display: 'none', width: '42px', height: '42px', borderRadius: '0.8rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'white', cursor: 'pointer' }}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="logo gradient-text" style={{ fontWeight: 800 }}>Admin<span style={{ color: 'white' }}>Panel</span></div>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Logout <i className="fas fa-sign-out-alt"></i></button>
        </div>
      </nav>

      <div
        className={`admin-sidebar-overlay ${isMobileSidebarOpen ? 'is-open' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <div className="container admin-layout" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', marginTop: '2rem' }}>
        <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'is-open' : ''}`}>
          <div className="admin-sidebar-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="gradient-text" style={{ fontWeight: 800 }}>Menu Admin</div>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
            { id: 'feedback', label: 'Pesan Masuk', icon: 'fa-envelope' },
            { id: 'logs', label: 'Log Pengunjung', icon: 'fa-list' },
            { id: 'maps', label: 'Maps Pengunjung', icon: 'fa-map-marked-alt' }
          ].map(tab => (
            <button key={tab.id} className="admin-tab-button" onClick={() => handleTabChange(tab.id)} style={{ width: '100%', textAlign: 'left', padding: '1.2rem', marginBottom: '0.5rem', background: activeTab === tab.id ? 'var(--primary)' : 'rgba(30, 41, 59, 0.4)', color: 'white', border: 'none', borderRadius: '0.8rem', cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <i className={`fas ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </aside>

        <main className="admin-main" style={{ paddingBottom: '5rem' }}>
          {activeTab === 'dashboard' && (
            <div className="glass animate-up admin-panel" style={{ padding: '3rem' }}>
              <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Control Center</h1>
                <div className="admin-panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Updated: {lastUpdated.toLocaleTimeString()}</span>
                   <button onClick={fetchData} disabled={isLoading} style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.6rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i> Refresh
                   </button>
                </div>
              </div>
              <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem' }}>
                <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--text-muted)' }}>Online Sekarang</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>{locations.filter(l => isOnline(l.last_activity)).length}</div>
                </div>
                <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--text-muted)' }}>Total Kunjungan</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{locations.length}</div>
                </div>
                <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--text-muted)' }}>Feedback Masuk</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6' }}>{feedbacks.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="glass animate-up admin-panel" style={{ padding: '2rem' }}>
              <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Daftar Pesan Masuk</h2>
                <button onClick={fetchData} disabled={isLoading} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                   <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
              <div className="admin-table-wrap">
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--primary)' }}>
                    <th style={{ padding: '1.2rem' }}>Nama</th>
                    <th style={{ padding: '1.2rem' }}>Email</th>
                    <th style={{ padding: '1.2rem' }}>Pesan</th>
                    <th style={{ padding: '1.2rem' }}>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map(f => (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <td data-label="Nama" style={{ padding: '1.2rem' }}>{f.name}</td>
                      <td data-label="Email" style={{ padding: '1.2rem' }}>{f.email}</td>
                      <td data-label="Pesan" style={{ padding: '1.2rem' }}>{f.message}</td>
                      <td data-label="Waktu" style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(f.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="glass animate-up admin-panel" style={{ padding: '2rem' }}>
              <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Advanced Log Pengunjung</h2>
                <button onClick={fetchData} disabled={isLoading} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                   <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
              <div className="admin-table-wrap">
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--primary)', borderBottom: '2px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem' }}>Date/Time</th>
                    <th style={{ padding: '1rem' }}>IP/Provider</th>
                    <th style={{ padding: '1rem' }}>Country</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>More</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map(loc => (
                    <tr key={loc.id} style={{ borderBottom: '1px solid var(--glass-border)', background: isOnline(loc.last_activity) ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                      <td data-label="Date/Time" style={{ padding: '1rem' }}>{new Date(loc.created_at).toLocaleString('id-ID')}</td>
                      <td data-label="IP/Provider" style={{ padding: '1rem' }}>
                        <div>{loc.ip_address}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{loc.isp}</div>
                      </td>
                      <td data-label="Country" style={{ padding: '1rem' }}>{formatLocationSummary(loc)}</td>
                      <td data-label="Status" style={{ padding: '1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: isOnline(loc.last_activity) ? '#10b981' : 'var(--text-muted)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline(loc.last_activity) ? '#10b981' : '#64748b' }}></span>
                          {isOnline(loc.last_activity) ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td data-label="More" style={{ padding: '1rem' }}>
                        <button onClick={() => setSelectedLog(loc)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}>Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {activeTab === 'maps' && (
            <div className="admin-maps-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', height: '700px' }}>
              <div ref={mapRef} className="admin-map-canvas" style={{ borderRadius: '1rem', border: '1px solid var(--glass-border)', zIndex: 1 }}></div>
              <div className="glass admin-map-sidebar" style={{ padding: '1.5rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }} className="gradient-text">Pengunjung Aktif</h3>
                  <button
                    onClick={fetchData}
                    disabled={isLoading}
                    style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontSize: '1.15rem', flex: '0 0 auto' }}
                    aria-label="Refresh peta pengunjung"
                    title="Refresh peta pengunjung"
                  >
                    <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                  </button>
                </div>
                {locations.map(loc => {
                  const online = isOnline(loc.last_activity);
                  const mapsUrl = getGoogleMapsUrl(loc);
                  return (
                    <div key={loc.id} onClick={() => focusOnUser(loc)} style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '0.8rem', marginBottom: '0.8rem', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: '0.3s hover', scale: '1' }} className="user-item admin-user-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: online ? 'var(--primary)' : 'white' }}>
                          {loc.device_model || 'Unknown Device'}
                        </span>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: online ? '#10b981' : '#64748b', boxShadow: online ? '0 0 10px #10b981' : 'none' }}></span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500, marginTop: '0.2rem' }}>{loc.ip_address}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{formatLocationSummary(loc)}</div>
                      {!online && <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>Last seen: {new Date(loc.last_activity).toLocaleTimeString()}</div>}
                      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(loc);
                          }}
                          style={{ flex: 1, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: 'var(--primary)', padding: '0.55rem 0.75rem', borderRadius: '0.55rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Detail
                        </button>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ flex: 1, textAlign: 'center', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#93c5fd', padding: '0.55rem 0.75rem', borderRadius: '0.55rem', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Advanced Log Modal */}
      {selectedLog && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' }}>
          <div className="glass admin-modal-panel" style={{ width: '92%', maxWidth: '760px', maxHeight: '88vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.88)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Detail Pengunjung</h3>
                <div style={{ marginTop: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{selectedLog.device_model || 'Unknown Device'} • {formatLocationSummary(selectedLog)}</div>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div className="admin-modal-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="glass" style={{ padding: '1rem 1.1rem', background: 'rgba(16, 185, 129, 0.08)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.4rem' }}>Lokasi Ringkas</div>
                  <div style={{ fontWeight: 700, lineHeight: 1.5 }}>{formatLocationSummary(selectedLog)}</div>
                </div>
                <div className="glass" style={{ padding: '1rem 1.1rem', background: 'rgba(59, 130, 246, 0.08)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.4rem' }}>Koordinat</div>
                  <div style={{ fontWeight: 700, lineHeight: 1.5 }}>{selectedLog.latitude && selectedLog.longitude ? `${selectedLog.latitude}, ${selectedLog.longitude}` : '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {detailItems.map((item, idx) => (
                  <div key={idx} className="glass" style={{ padding: '0.95rem 1rem', background: item.fullRow ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.45rem' }}>{item.label}</div>
                    <div style={{ color: 'white', wordBreak: 'break-word', lineHeight: 1.6 }}>{item.value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer" style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
              {getGoogleMapsUrl(selectedLog) && (
                <a
                  href={getGoogleMapsUrl(selectedLog)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '0.7rem 1.2rem', borderRadius: '0.6rem', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.12)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Buka di Google Maps
                </a>
              )}
              <button onClick={() => setSelectedLog(null)} className="btn-primary" style={{ padding: '0.6rem 2rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style jsx global>{`
        .sidebar-link:hover { background: rgba(16, 185, 129, 0.2) !important; }
        .user-item:hover { transform: translateX(5px); border-color: var(--primary) !important; }
        .custom-icon { pointer-events: none; }
        .admin-table-wrap { width: 100%; overflow-x: auto; }
        .admin-table { min-width: 720px; }
        .admin-sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 40;
        }
        .admin-sidebar-overlay.is-open {
          opacity: 1;
          pointer-events: auto;
        }
        @media (max-width: 1024px) {
          .admin-layout { grid-template-columns: 1fr !important; }
          .admin-sidebar {
            display: grid;
            grid-template-columns: repeat(4, minmax(150px, 1fr));
            gap: 0.75rem;
            overflow-x: auto;
            padding-bottom: 0.25rem;
          }
          .admin-tab-button {
            margin-bottom: 0 !important;
            min-width: 150px;
            justify-content: center;
          }
          .admin-panel-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          .admin-panel-actions {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .admin-maps-layout {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .admin-map-canvas {
            min-height: 420px;
          }
          .admin-map-sidebar {
            max-height: 420px;
          }
        }
        @media (max-width: 768px) {
          .admin-mobile-menu-btn {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }
          .admin-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-panel {
            padding: 1.25rem !important;
          }
          .admin-layout {
            margin-top: 1rem !important;
          }
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 50;
            width: min(320px, calc(100vw - 3rem));
            background: #0b1323;
            padding: 1rem;
            display: block;
            overflow-y: auto;
            transform: translateX(-100%);
            transition: transform 0.28s ease;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35);
          }
          .admin-sidebar.is-open {
            transform: translateX(0);
          }
          .admin-sidebar-header {
            display: flex !important;
          }
          .admin-main {
            padding-bottom: 2rem !important;
          }
          .admin-map-canvas {
            min-height: 320px;
          }
          .admin-map-sidebar {
            max-height: none;
          }
          .admin-table-wrap {
            overflow: visible;
          }
          .admin-table,
          .admin-table thead,
          .admin-table tbody,
          .admin-table tr,
          .admin-table th,
          .admin-table td {
            display: block;
            width: 100%;
          }
          .admin-table {
            min-width: 100%;
          }
          .admin-table thead {
            display: none;
          }
          .admin-table tbody {
            display: grid;
            gap: 0.85rem;
          }
          .admin-table tr {
            border: 1px solid var(--glass-border) !important;
            border-radius: 1rem;
            background: rgba(15, 23, 42, 0.55) !important;
            overflow: hidden;
          }
          .admin-table td {
            padding: 0.9rem 1rem !important;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .admin-table td:first-child {
            border-top: none;
          }
          .admin-table td::before {
            content: attr(data-label);
            display: block;
            margin-bottom: 0.35rem;
            color: var(--primary);
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .admin-user-card {
            padding: 0.9rem !important;
          }
          .admin-modal-overlay {
            padding: 0.75rem;
            align-items: flex-end !important;
          }
          .admin-modal-panel {
            width: 100% !important;
            max-height: 92vh !important;
            border-radius: 1rem !important;
          }
          .admin-modal-header,
          .admin-modal-body,
          .admin-modal-footer {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .admin-modal-summary {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .admin-tab-button {
            min-width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

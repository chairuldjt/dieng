'use client';
import { useState } from 'react';

export default function ContactForm() {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = {
            name: e.target.name.value,
            email: e.target.email.value,
            message: e.target.message.value,
        };

        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setStatus('success');
                e.target.reset();
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(''), 5000);
        }
    };

    return (
        <section id="contact" style={{ padding: '8rem 0', background: '#1e293b' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ada <span className="gradient-text">Pertanyaan?</span></h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ingin tahu lebih banyak tentang Dieng? Hubungi kami sekarang dan kami akan membantu merencanakan liburan impian Anda.</p>
                </div>
                <div className="glass" style={{ padding: '3rem' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nama Lengkap</label>
                            <input name="name" type="text" className="form-control" style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: 'white', outline: 'none' }} required />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email</label>
                            <input name="email" type="email" className="form-control" style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: 'white', outline: 'none' }} required />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Pesan</label>
                            <textarea name="message" rows="4" className="form-control" style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: 'white', outline: 'none' }} required></textarea>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Mengirim...' : 'Kirim Pesan'}
                        </button>
                        {status === 'success' && <p style={{ color: '#10b981', marginTop: '1rem', textAlign: 'center' }}>Pesan berhasil terkirim!</p>}
                        {status === 'error' && <p style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>Gagal mengirim pesan.</p>}
                    </form>
                </div>
            </div>
        </section>
    );
}

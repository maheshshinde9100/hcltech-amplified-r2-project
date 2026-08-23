'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return showToast('Please fill in all fields.', 'error');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      showToast('Account created! Welcome 🎉', 'success');
      router.push('/onboarding');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(108,99,255,0.15) 0%, transparent 60%), var(--surface-1)',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(108,99,255,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(72,202,228,0.06)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
            background: 'linear-gradient(135deg,#6C63FF,#48CAE4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
          }}>🚀</div>
          <h1 className="font-display gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Start your AI-powered learning journey today
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: '40px 36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                className="input-field"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="input-field"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 8, padding: '14px', width: '100%', fontSize: '1rem' }}
            >
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {loading ? <><span className="spinner" /> Creating account…</> : '✨ Create Account'}
              </span>
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#8B83FF', fontWeight: 600, textDecoration: 'none' }}>
                Sign In →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

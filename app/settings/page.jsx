'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser]     = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm]     = useState({ careerGoal: '', experienceLevel: 'beginner', learningStyle: 'mixed', timeframe: 'flexible' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    (async () => {
      try {
        const [meRes, profRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/profile')]);
        const meData = await meRes.json();
        if (meData.error) { router.push('/login'); return; }
        setUser(meData.user);
        const profData = await profRes.json();
        if (profData.profile && !profData.profile._id === undefined) {
          setProfile(profData.profile);
          setForm(f => ({
            ...f,
            careerGoal:      profData.profile.careerGoal      || '',
            experienceLevel: profData.profile.experienceLevel || 'beginner',
            learningStyle:   profData.profile.learningStyle   || 'mixed',
            timeframe:       profData.profile.timeframe       || 'flexible',
          }));
        }
      } catch (e) {
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      setProfile(data.profile);
      showToast('Settings saved ✓', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setSaving(true);
    showToast('🤖 Regenerating your learning path…', 'info');
    try {
      const res = await fetch('/api/path/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText: form.careerGoal }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      showToast('🎉 New learning path generated!', 'success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(108,99,255,0.2)', borderTopColor: '#6C63FF', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-1)' }}>
      <Navbar user={user} />
      <main style={{ paddingTop: 96, maxWidth: 720, margin: '0 auto', padding: '96px 24px 60px' }}>
        <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>⚙️ Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: '0.95rem' }}>Update your profile and learning preferences.</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Career Goal */}
          <div className="stat-card">
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Career Goal</h3>
            <label className="label" htmlFor="settings-goal">Describe your goal</label>
            <textarea
              id="settings-goal"
              className="input-field"
              style={{ height: 100, resize: 'none', lineHeight: 1.6 }}
              value={form.careerGoal}
              onChange={e => setForm(f => ({ ...f, careerGoal: e.target.value }))}
              placeholder="e.g. Become a senior full-stack developer using React and Node.js"
            />
          </div>

          {/* Level + Style */}
          <div className="stat-card">
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Learning Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="label" htmlFor="settings-level">Experience Level</label>
                <select id="settings-level" className="input-field" value={form.experienceLevel} onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))}>
                  <option value="beginner">🌱 Beginner</option>
                  <option value="intermediate">⚡ Intermediate</option>
                  <option value="advanced">🔥 Advanced</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="settings-style">Learning Style</label>
                <select id="settings-style" className="input-field" value={form.learningStyle} onChange={e => setForm(f => ({ ...f, learningStyle: e.target.value }))}>
                  <option value="visual">📹 Visual</option>
                  <option value="reading">📖 Reading</option>
                  <option value="hands-on">💻 Hands-on</option>
                  <option value="mixed">🎲 Mixed</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={saving} id="settings-save" style={{ flex: 1, padding: '13px' }}>
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Settings'}
              </span>
            </button>
            <button type="button" className="btn-secondary" onClick={handleRegenerate} disabled={saving || !form.careerGoal} id="settings-regen" style={{ flex: 1, padding: '13px' }}>
              {saving ? '⏳' : '🔄'} Regenerate Path
            </button>
          </div>
        </form>

        {/* Account info */}
        <div className="stat-card" style={{ marginTop: 32 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#48CAE4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>{user?.name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import {
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const TYPE_COLORS = {
  foundation: '#6C63FF',
  core:       '#48CAE4',
  advanced:   '#F72585',
  project:    '#22C55E',
};

const STATUS_COLORS = {
  completed:   '#22C55E',
  in_progress: '#6C63FF',
  not_started: '#2E2C46',
  struggling:  '#EF4444',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [path, setPath]         = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const [meRes, pathRes, progRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/path'),
          fetch('/api/progress'),
        ]);
        const meData   = await meRes.json();
        if (meData.error) { router.push('/login'); return; }
        setUser(meData.user);

        const pathData = await pathRes.json();
        setPath(pathData.path);

        const progData = await progRes.json();
        setProgress(progData);
      } catch (e) {
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMilestoneUpdate = async (milestoneId, newStatus, feedback = '') => {
    setUpdatingId(milestoneId);
    try {
      // Use milestone ID if available, otherwise use the index
      const apiId = milestoneId || milestones.findIndex(m => m.id === milestoneId);
      const res = await fetch(`/api/milestone/${apiId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, feedback }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);

      if (data.reGenerated) {
        showToast('Path has been adaptively regenerated for you!', 'info');
        const pathRes = await fetch('/api/path');
        const pathData = await pathRes.json();
        setPath(pathData.path);
        
        const progRes = await fetch('/api/progress');
        const progData = await progRes.json();
        setProgress(progData);
      } else {
        setPath(p => ({
          ...p,
          milestones: p.milestones.map(m =>
            m.id === milestoneId ? { ...m, status: newStatus } : m
          ),
        }));
        setProgress(p => ({ ...p, progressPercent: data.progressPercent }));
        showToast(newStatus === 'completed' ? 'Milestone completed!' : 'Status updated', 'success');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Charts data
  const milestones = path?.milestones || [];

  const statusPieData = [
    { name: 'Completed',   value: milestones.filter(m => m.status === 'completed').length,   color: '#22C55E' },
    { name: 'In Progress', value: milestones.filter(m => m.status === 'in_progress').length, color: '#6C63FF' },
    { name: 'Not Started', value: milestones.filter(m => !m.status || m.status === 'not_started').length, color: '#2E2C46' },
  ].filter(d => d.value > 0);

  const weeksBarData = milestones.map(m => ({
    name: m.title?.slice(0, 12) + (m.title?.length > 12 ? '…' : ''),
    weeks: m.estimatedWeeks || 1,
    fill: TYPE_COLORS[m.type] || '#6C63FF',
  }));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(108,99,255,0.2)', borderTopColor: '#6C63FF', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your dashboard…</p>
      </div>
    );
  }

  if (!path) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar user={user} />
        <div style={{ paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 20 }}>
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700 }}>No learning path yet</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 400 }}>Complete the onboarding to generate your personalized AI learning path.</p>
          <button className="btn-primary" onClick={() => router.push('/onboarding')} id="go-to-onboarding">
            <span style={{ position: 'relative', zIndex: 1 }}>Start Onboarding</span>
          </button>
        </div>
      </div>
    );
  }

  const pct = progress?.progressPercent ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-1)' }}>
      <Navbar user={user} />

      <main style={{ paddingTop: 80, maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px' }}>
        {/* Hero Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your Learning Path</p>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            {path.title || 'My Learning Journey'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600, fontSize: '0.95rem' }}>{path.description}</p>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{path.domain}</span>
            <span className="badge badge-info">~{path.totalEstimatedWeeks} weeks</span>
            <span className="badge badge-success">{milestones.length} milestones</span>
            <button className="btn-secondary" style={{ padding: '4px 14px', fontSize: '0.8rem' }} onClick={() => router.push('/roadmap')} id="view-roadmap-btn">
              View Roadmap →
            </button>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 36 }}>
          {/* Progress card */}
          <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(108,99,255,0.08)' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Progress</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(135deg,#6C63FF,#48CAE4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
              {pct}%
            </div>
            <div className="progress-track" style={{ marginTop: 16 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Completed */}
          <div className="stat-card">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>
              {milestones.filter(m => m.status === 'completed').length}
            </div>
            <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>of {milestones.length} milestones</p>
          </div>

          {/* Weeks remaining */}
          <div className="stat-card">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. Weeks Left</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>
              {milestones
                .filter(m => m.status !== 'completed')
                .reduce((s, m) => s + (m.estimatedWeeks || 1), 0)}
            </div>
            <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>to finish your path</p>
          </div>

          {/* Domain */}
          <div className="stat-card">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Domain</p>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {path.domain}
            </div>
            <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{path.parsedGoal?.targetRole || 'Professional track'}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 40 }}>
          {/* Pie chart */}
          <div className="stat-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20, color: 'var(--text-secondary)' }}>Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend
                  formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div className="stat-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20, color: 'var(--text-secondary)' }}>Weeks per Milestone</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeksBarData} barSize={24}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="weeks" radius={[6, 6, 0, 0]}>
                  {weeksBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestones List */}
        <div>
          <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>Milestones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {milestones.map((m, i) => {
              const status = m.status || 'not_started';
              const isUpdating = updatingId === m.id;
              return (
                <div
                  key={m.id || i}
                  id={`milestone-${m.id || i}`}
                  className="glass-light"
                  style={{
                    padding: '24px',
                    border: `1px solid ${status === 'completed' ? 'rgba(34,197,94,0.2)' : status === 'in_progress' ? 'rgba(108,99,255,0.2)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', gap: 20, alignItems: 'flex-start',
                    opacity: isUpdating ? 0.7 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  {/* Order number */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: status === 'completed' ? 'rgba(34,197,94,0.15)' : `rgba(108,99,255,0.12)`,
                    border: `1px solid ${STATUS_COLORS[status]}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: 700, color: STATUS_COLORS[status],
                  }}>
                    {status === 'completed' ? '✓' : i + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</h3>
                      <span className={`badge badge-${m.type === 'project' ? 'success' : m.type === 'advanced' ? 'danger' : 'primary'}`}>
                        {m.type}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>~{m.estimatedWeeks}w</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                      {m.description}
                    </p>
                    {m.topics?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {m.topics.map(t => (
                          <span key={t} style={{
                            padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem',
                            background: 'var(--surface-4)', color: 'var(--text-muted)',
                          }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {/* Resources */}
                    {m.resources?.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {m.resources.slice(0, 3).map((r, ri) => (
                          <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '4px 12px', borderRadius: 999,
                              background: 'var(--surface-3)', border: '1px solid var(--border)',
                              fontSize: '0.75rem', color: 'var(--text-secondary)',
                              textDecoration: 'none', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            {r.type === 'video' ? 'Video' : r.type === 'course' ? 'Course' : r.type === 'project' ? 'Project' : 'Article'}: {r.title?.slice(0, 30)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                    {isUpdating
                      ? <div className="spinner" />
                      : (
                        <select
                          id={`status-select-${m.id || i}`}
                          value={status}
                          onChange={e => {
                            if (e.target.value === 'struggling') {
                              const fb = prompt("What are you struggling with? (e.g. 'too hard', 'need more basics')");
                              if (fb !== null) handleMilestoneUpdate(m.id || i, e.target.value, fb);
                            } else {
                              handleMilestoneUpdate(m.id || i, e.target.value);
                            }
                          }}
                          style={{
                            padding: '7px 12px', borderRadius: 8,
                            background: 'var(--surface-4)', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer',
                          }}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="struggling">Struggling</option>
                        </select>
                      )
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

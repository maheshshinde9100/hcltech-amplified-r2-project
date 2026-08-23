'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';

const STATUS_STYLE = {
  completed:   { border: '1.5px solid #22C55E', background: 'rgba(34,197,94,0.08)', icon: '✅' },
  in_progress: { border: '1.5px solid #6C63FF', background: 'rgba(108,99,255,0.10)', icon: '⚡' },
  not_started: { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(46,44,70,0.6)', icon: '🔒' },
};

const TYPE_COLOR = {
  foundation: '#6C63FF',
  core:       '#48CAE4',
  advanced:   '#F72585',
  project:    '#22C55E',
};

function MilestoneNode({ data }) {
  const style = STATUS_STYLE[data.status] || STATUS_STYLE.not_started;
  return (
    <div
      onClick={data.onClick}
      style={{
        padding: '16px 20px',
        minWidth: 200, maxWidth: 230,
        borderRadius: 14,
        ...style,
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        boxShadow: data.status === 'in_progress' ? '0 0 20px rgba(108,99,255,0.3)' : 'none',
        transition: 'all 0.2s ease',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 6 }}>{style.icon}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{data.label}</div>
      <div style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: '0.65rem',
        fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        background: `${TYPE_COLOR[data.type]}22`,
        color: TYPE_COLOR[data.type] || '#6C63FF',
        border: `1px solid ${TYPE_COLOR[data.type]}44`,
        marginBottom: 6,
      }}>{data.type}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>~{data.weeks}w</div>
    </div>
  );
}

const nodeTypes = { milestone: MilestoneNode };

export default function RoadmapPage() {
  const router = useRouter();
  const [user, setUser]               = useState(null);
  const [path, setPath]               = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const showToast = (m, t) => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 4000); };

  const buildGraph = useCallback((milestones) => {
    const newNodes = milestones.map((m, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      return {
        id: m.id || String(i),
        type: 'milestone',
        position: { x: col * 280, y: row * 180 },
        data: {
          label: m.title,
          status: m.status || 'not_started',
          type: m.type || 'core',
          weeks: m.estimatedWeeks || 1,
          milestoneData: m,
          onClick: () => setSelectedMilestone(m),
        },
      };
    });

    const newEdges = milestones.slice(1).map((m, i) => ({
      id: `e${i}-${i + 1}`,
      source: milestones[i].id || String(i),
      target: m.id || String(i + 1),
      animated: milestones[i].status === 'in_progress',
      style: {
        stroke: milestones[i].status === 'completed' ? '#22C55E' : 'rgba(108,99,255,0.4)',
        strokeWidth: 2,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, pathRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/path')]);
        const meData   = await meRes.json();
        if (meData.error) { router.push('/login'); return; }
        setUser(meData.user);
        const pathData = await pathRes.json();
        if (pathData.path) {
          setPath(pathData.path);
          buildGraph(pathData.path.milestones || []);
        }
      } catch (e) {
        showToast('Failed to load roadmap', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStatusUpdate = async (milestoneId, newStatus) => {
    try {
      const res = await fetch(`/api/milestone/${milestoneId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);

      setPath(p => {
        const updated = { ...p, milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m) };
        buildGraph(updated.milestones);
        return updated;
      });
      setSelectedMilestone(m => m ? { ...m, status: newStatus } : m);
      showToast(newStatus === 'completed' ? '🎉 Milestone completed!' : '📌 Status updated', 'success');
    } catch (e) {
      showToast(e.message, 'error');
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

      <main style={{ paddingTop: 64, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              🗺 Learning Roadmap
            </h1>
            {path && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{path.title}</p>}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {['completed', 'in_progress', 'not_started'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s === 'completed' ? '#22C55E' : s === 'in_progress' ? '#6C63FF' : 'var(--surface-4)', border: '1px solid rgba(255,255,255,0.1)' }} />
                {s.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!path ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 60 }}>🗺️</div>
              <h2 style={{ fontWeight: 700, fontSize: '1.4rem' }}>No roadmap yet</h2>
              <button className="btn-primary" onClick={() => router.push('/onboarding')} id="roadmap-start-onboarding">
                <span style={{ position: 'relative', zIndex: 1 }}>🚀 Generate My Path</span>
              </button>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="rgba(108,99,255,0.08)" gap={32} size={1.5} />
              <Controls style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
              <MiniMap
                nodeColor={n => STATUS_STYLE[n.data?.status]?.border?.replace('1.5px solid ', '').replace('1px solid ', '') || '#2E2C46'}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              />
            </ReactFlow>
          )}

          {/* Side Panel for selected milestone */}
          {selectedMilestone && (
            <div style={{
              position: 'absolute', top: 16, right: 16, bottom: 16,
              width: 340, borderRadius: 'var(--radius-lg)',
              background: 'rgba(26,24,40,0.95)', backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)', padding: 28, overflowY: 'auto',
              animation: 'fadeInUp 0.25s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>
                    {STATUS_STYLE[selectedMilestone.status || 'not_started']?.icon}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedMilestone.title}</h3>
                </div>
                <button onClick={() => setSelectedMilestone(null)} id="close-milestone-panel"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22 }}>×</button>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                {selectedMilestone.description}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                <span className="badge badge-primary">{selectedMilestone.type}</span>
                <span className="badge badge-info">~{selectedMilestone.estimatedWeeks}w</span>
              </div>

              {selectedMilestone.topics?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Topics</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedMilestone.topics.map(t => (
                      <span key={t} style={{ padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', background: 'var(--surface-4)', color: 'var(--text-muted)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedMilestone.resources?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Resources</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedMilestone.resources.slice(0, 4).map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          borderRadius: 10, background: 'var(--surface-3)', border: '1px solid var(--border)',
                          textDecoration: 'none', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <span style={{ fontSize: 16 }}>{r.type === 'video' ? '▶️' : r.type === 'course' ? '🎓' : r.type === 'project' ? '🛠️' : '📄'}</span>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{r.title?.slice(0, 36)}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.estimatedHours}h • {r.difficulty}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Update Status</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['not_started', 'in_progress', 'completed'].map(s => (
                    <button
                      key={s}
                      id={`roadmap-status-${s}`}
                      onClick={() => handleStatusUpdate(selectedMilestone.id, s)}
                      style={{
                        padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                        background: selectedMilestone.status === s ? 'rgba(108,99,255,0.15)' : 'var(--surface-3)',
                        border: `1px solid ${selectedMilestone.status === s ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
                        color: selectedMilestone.status === s ? '#8B83FF' : 'var(--text-secondary)',
                        fontWeight: 500, fontSize: '0.875rem', transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      {STATUS_STYLE[s].icon} {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

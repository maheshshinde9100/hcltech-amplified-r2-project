import Link from 'next/link';

export const metadata = {
  title: 'PathAI – AI-Powered Personalized Learning Paths',
  description: 'Generate a personalized learning roadmap powered by Groq AI and Gemini. Tailored to your career goals.',
};

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: 'var(--surface-1)', zIndex: -1 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(108,99,255,0.08)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '20%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(72,202,228,0.06)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(247,37,133,0.04)', filter: 'blur(100px)' }} />
      </div>

      {/* Nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,14,26,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6C63FF,#48CAE4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>P</div>
          <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Path<span className="gradient-text-blue">AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn-ghost" id="nav-login">Sign In</Link>
          <Link href="/register" className="btn-primary" id="nav-register">
            <span style={{ position: 'relative', zIndex: 1 }}>Get Started →</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 80, textAlign: 'center', maxWidth: 860, margin: '0 auto', padding: '140px 24px 80px' }}>
        <div className="animate-fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', marginBottom: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C63FF', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8B83FF', letterSpacing: '0.04em' }}>POWERED BY GROQ + GEMINI AI</span>
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.12, marginBottom: 24, color: 'var(--text-primary)' }}>
            Your{' '}
            <span className="gradient-text">personalized</span>
            <br />learning path, powered by AI
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 44, maxWidth: 600, margin: '0 auto 44px' }}>
            Describe your career goal and let our AI build you a precise, step-by-step roadmap — complete with curated resources, milestone tracking, and smart skill gap analysis.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" id="hero-cta" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>🚀 Build My Learning Path</span>
            </Link>
            <Link href="/login" className="btn-secondary" id="hero-login" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
              Sign In →
            </Link>
          </div>
        </div>

        {/* Feature Pills */}
        <div style={{ marginTop: 64, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['🧠 AI Goal Parsing', '📊 Skill Gap Analysis', '🗺 Visual Roadmap', '📈 Progress Tracking', '🎯 Smart Recommendations'].map(f => (
            <div key={f} style={{
              padding: '9px 18px', borderRadius: 999,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500,
            }}>{f}</div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { icon: '🎯', title: 'Goal Parsing', desc: 'Describe your dream role in plain English. Our AI extracts domain, target role, required skills and timeline automatically.' },
            { icon: '🔍', title: 'Skill Gap Analysis', desc: 'Tell us what you already know. We compute exactly what you\'re missing using a topological skill graph.' },
            { icon: '🗺️', title: 'Visual Roadmap', desc: 'See your entire journey as an interactive node graph. Click any milestone to explore resources and update status.' },
            { icon: '📚', title: 'Curated Resources', desc: 'AI selects the best articles, videos, and courses from our catalog — matched to your level and learning style.' },
            { icon: '📊', title: 'Progress Dashboard', desc: 'Track completions, visualize weeks remaining, and get chart-based insights on your learning velocity.' },
            { icon: '⚡', title: 'Lightning Fast', desc: 'Groq Llama 3 delivers sub-second AI responses. Gemini Flash as fallback ensures 99.9% availability.' },
          ].map((f, i) => (
            <div key={i} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 32 }}>{f.icon}</div>
              <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto', padding: '60px 40px', borderRadius: 28, textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(72,202,228,0.1) 100%)',
          border: '1px solid rgba(108,99,255,0.2)',
        }}>
          <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>
            Ready to accelerate your career?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1rem' }}>
            Join learners building their futures with AI-powered personalized paths.
          </p>
          <Link href="/register" className="btn-primary" id="footer-cta" style={{ padding: '16px 44px', fontSize: '1.05rem' }}>
            <span style={{ position: 'relative', zIndex: 1 }}>Get Started Free →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

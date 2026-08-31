'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

const STEPS = [
  {
    id: 'goal',
    title: "What's your learning goal?",
    subtitle: "Describe where you want to be in your career. Be specific!",
    placeholder: "e.g. I want to become a full-stack web developer using React and Node.js within 6 months",
    type: 'textarea',
  },
  {
    id: 'experience',
    title: "Your experience level",
    subtitle: "Be honest — this helps us calibrate your path perfectly.",
    type: 'radio',
    options: [
      { value: 'beginner',     label: 'Beginner',     desc: 'Just starting out, minimal experience' },
      { value: 'intermediate', label: 'Intermediate', desc: '1–2 years of coding experience' },
      { value: 'advanced',     label: 'Advanced',     desc: 'Professional experience, looking to level up' },
    ],
  },
  {
    id: 'style',
    title: "How do you learn best?",
    subtitle: "We'll prioritize resources that match your preferred style.",
    type: 'radio',
    options: [
      { value: 'visual',    label: 'Visual',    desc: 'Videos, animations, diagrams' },
      { value: 'reading',   label: 'Reading',   desc: 'Articles, documentation, books' },
      { value: 'hands-on',  label: 'Hands-on',  desc: 'Projects, exercises, challenges' },
      { value: 'mixed',     label: 'Mixed',     desc: 'A balanced combination of all' },
    ],
  },
  {
    id: 'topics',
    title: "Topics you already know",
    subtitle: "Select all that apply — we'll skip these in your path.",
    type: 'chips',
    options: ['HTML', 'CSS', 'JavaScript Basics', 'React Basics', 'Python Basics', 'Node.js Basics', 'SQL Databases', 'Git Version Control', 'Docker', 'Linux Basics'],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ goal: '', experience: '', style: '', topics: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const current = STEPS[step];

  const canProceed = () => {
    if (current.id === 'goal') return answers.goal.trim().length >= 10;
    if (current.id === 'experience') return !!answers.experience;
    if (current.id === 'style') return !!answers.style;
    return true;
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      // Final step — save profile and generate path
      setLoading(true);
      try {
        // 1. Save learner profile
        const profileRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experienceLevel: answers.experience,
            learningStyle: answers.style,
            completedCourses: answers.topics,
            careerGoal: answers.goal,
            interests: [],
          }),
        });
        if (!profileRes.ok) throw new Error('Failed to save profile');

        // 2. Generate AI learning path
        showToast('AI is generating your personalized path…', 'info');
        const pathRes = await fetch('/api/path/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalText: answers.goal }),
        });
        const pathData = await pathRes.json();
        if (pathData.error) throw new Error(pathData.message);

        showToast('Your learning path is ready!', 'success');
        setTimeout(() => router.push('/dashboard'), 1000);
      } catch (err) {
        showToast(err.message || 'Something went wrong, please try again.', 'error');
        setLoading(false);
      }
    }
  };

  const toggleChip = (val) => {
    setAnswers(a => ({
      ...a,
      topics: a.topics.includes(val) ? a.topics.filter(t => t !== val) : [...a.topics, val],
    }));
  };

  const progressPercent = ((step) / STEPS.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      background: 'radial-gradient(ellipse 100% 50% at 50% 0%, rgba(108,99,255,0.1) 0%, transparent 70%), var(--surface-1)',
    }}>
      {/* Progress bar at top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#6C63FF,#48CAE4)', width: `${progressPercent}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: i === step ? 28 : 8, height: 8, borderRadius: 4,
              background: i < step ? 'linear-gradient(90deg,#6C63FF,#48CAE4)' : i === step ? '#6C63FF' : 'var(--surface-4)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
            {current.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{current.subtitle}</p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: '36px' }}>
          {/* Textarea */}
          {current.type === 'textarea' && (
            <textarea
              id="onboarding-goal"
              className="input-field"
              style={{ height: 140, resize: 'none', lineHeight: 1.6 }}
              placeholder={current.placeholder}
              value={answers.goal}
              onChange={e => setAnswers(a => ({ ...a, goal: e.target.value }))}
            />
          )}

          {/* Radio */}
          {current.type === 'radio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {current.options.map(opt => {
                const isSelected = answers[current.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    id={`onboarding-${current.id}-${opt.value}`}
                    type="button"
                    onClick={() => setAnswers(a => ({ ...a, [current.id]: opt.value }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(108,99,255,0.12)' : 'var(--surface-3)',
                      border: `1px solid ${isSelected ? 'rgba(108,99,255,0.5)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? '#6C63FF' : 'var(--text-muted)'}`,
                      background: isSelected ? '#6C63FF' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Chips */}
          {current.type === 'chips' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {current.options.map(opt => {
                const selected = answers.topics.includes(opt);
                return (
                  <button
                    key={opt}
                    id={`chip-${opt.replace(/\s+/g,'-')}`}
                    type="button"
                    onClick={() => toggleChip(opt)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 999,
                      border: `1px solid ${selected ? 'rgba(108,99,255,0.6)' : 'var(--border)'}`,
                      background: selected ? 'rgba(108,99,255,0.15)' : 'var(--surface-3)',
                      color: selected ? '#8B83FF' : 'var(--text-secondary)',
                      fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {selected ? '✓ ' : ''}{opt}
                  </button>
                );
              })}
              <p style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                {answers.topics.length} selected — or skip to start from scratch
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn-secondary"
              onClick={() => step > 0 && setStep(s => s - 1)}
              disabled={step === 0 || loading}
              style={{ opacity: step === 0 ? 0 : 1 }}
              id="onboarding-back"
            >
              ← Back
            </button>

            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!canProceed() || loading}
              id="onboarding-next"
              style={{ padding: '12px 32px' }}
            >
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {loading
                  ? <><span className="spinner" /> Generating your path…</>
                  : step === STEPS.length - 1 ? 'Generate My Path' : 'Continue →'
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

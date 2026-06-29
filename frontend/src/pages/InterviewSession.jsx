import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';
import { Clock, CheckCircle, ChevronRight, RotateCcw, BarChart2 } from 'lucide-react';

const CATEGORIES = [
  { key: 'all',           icon: '⚡', label: 'Mixed' },
  { key: 'dsa',           icon: '🌳', label: 'DSA' },
  { key: 'system_design', icon: '🏗️', label: 'System Design' },
  { key: 'behavioral',    icon: '🤝', label: 'Behavioral' },
  { key: 'javascript',    icon: '🟡', label: 'JavaScript' },
  { key: 'python',        icon: '🐍', label: 'Python' },
  { key: 'sql',           icon: '🗄️', label: 'SQL' },
];

const DIFFS = ['all', 'easy', 'medium', 'hard'];
const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444', all: '#6c63ff' };

export default function InterviewSession() {
  const [phase, setPhase] = useState('setup');
  const [cat, setCat] = useState('all');
  const [diff, setDiff] = useState('all');
  const [numQ, setNumQ] = useState(5);
  const [session, setSession] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timer, setTimer] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    if (phase !== 'interview') return;
    timerRef.current = setInterval(() => setTimer(t => {
      if (t <= 1) { clearInterval(timerRef.current); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIdx]);

  const startSession = async () => {
    const res = await authFetch('/interview/sessions', {
      method: 'POST',
      body: JSON.stringify({ category: cat, difficulty: diff, num_questions: numQ }),
    });
    if (!res.ok) { alert('Failed to start session.'); return; }
    const data = await res.json();
    setSession(data); setPhase('interview'); setQIdx(0);
    setTimer(120); startTimeRef.current = Date.now();
  };

  const submitAnswer = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true); clearInterval(timerRef.current);
    const q = session.questions[qIdx];
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const res = await authFetch(`/interview/sessions/${session.session_id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: q.id, user_answer: answer, time_taken: timeTaken }),
    });
    const data = await res.json();
    setFeedback(data);
    setAnswers(prev => [...prev, { q: q.text, score: data.ai_score, feedback: data.ai_feedback }]);
    setSubmitting(false);
  };

  const nextQuestion = () => {
    if (qIdx >= session.questions.length - 1) { finishSession(); return; }
    setQIdx(i => i + 1); setAnswer(''); setFeedback(null);
    setTimer(120); startTimeRef.current = Date.now();
  };

  const finishSession = async () => {
    await authFetch(`/interview/sessions/${session.session_id}/finish`, { method: 'POST' });
    setPhase('finished');
  };

  const avgScore = answers.length
    ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length * 10) / 10
    : 0;
  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');
  const timerUrgent = timer <= 20;

  return (
    <>
      <Navbar />
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 10 }}>

        {/* ── SETUP PHASE ── */}
        {phase === 'setup' && (
          <div className="animate-slide-up">
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
              Start an <span className="text-gradient">Interview</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '32px' }}>
              Choose a topic and difficulty, then answer AI-evaluated questions.
            </p>

            {/* Category */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
                📚 Category
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setCat(c.key)}
                    style={{
                      padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '7px',
                      fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                      background: cat === c.key ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.04)',
                      border: cat === c.key ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: cat === c.key ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <span>{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
                ⚖️ Difficulty
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DIFFS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDiff(d)}
                    style={{
                      padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', textTransform: 'capitalize',
                      background: diff === d ? `${DIFF_COLORS[d]}20` : 'rgba(255,255,255,0.04)',
                      border: diff === d ? `1px solid ${DIFF_COLORS[d]}60` : '1px solid rgba(255,255,255,0.08)',
                      color: diff === d ? DIFF_COLORS[d] : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {d === 'all' ? 'Mixed' : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  🔢 Questions
                </h3>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#a5b4fc' }}>{numQ}</span>
              </div>
              <input type="range" min={3} max={10} value={numQ} onChange={e => setNumQ(+e.target.value)}
                style={{ width: '100%', accentColor: '#6c63ff', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                <span>3</span><span>10</span>
              </div>
            </div>

            <button
              onClick={startSession}
              className="btn-gradient"
              style={{ padding: '14px 40px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
            >
              🚀 Start Interview
            </button>
          </div>
        )}

        {/* ── INTERVIEW PHASE ── */}
        {phase === 'interview' && session && (
          <div className="animate-fade-in">
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(90deg, #6c63ff, #a855f7)',
                  width: `${((qIdx + (feedback ? 1 : 0)) / session.questions.length) * 100}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                {qIdx + 1} / {session.questions.length}
              </span>
              {/* Timer */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '8px',
                background: timerUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                border: timerUrgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: timerUrgent ? '#ef4444' : 'rgba(255,255,255,0.7)',
                fontSize: '13px', fontWeight: 700,
                animation: timerUrgent ? 'pulse-glow 1s infinite' : 'none',
              }}>
                <Clock size={12} />
                {mm}:{ss}
              </div>
            </div>

            {/* Question card */}
            <div className="glass-card" style={{ padding: '28px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Q{qIdx + 1} of {session.questions.length}</span>
                <span style={{
                  padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
                  background: `${DIFF_COLORS[session.questions[qIdx].difficulty] || '#6c63ff'}20`,
                  color: DIFF_COLORS[session.questions[qIdx].difficulty] || '#a5b4fc',
                  border: `1px solid ${DIFF_COLORS[session.questions[qIdx].difficulty] || '#6c63ff'}40`,
                }}>
                  {session.questions[qIdx].difficulty}
                </span>
              </div>
              <p style={{ fontSize: '17px', lineHeight: 1.65, fontWeight: 500, color: '#f1f1f5', marginBottom: '20px' }}>
                {session.questions[qIdx].text}
              </p>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                disabled={!!feedback}
                placeholder="Type your answer here…"
                rows={6}
                style={{
                  width: '100%', padding: '14px', borderRadius: '10px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f1f1f5', fontSize: '14px', lineHeight: 1.6, resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
                  opacity: feedback ? 0.6 : 1,
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                {!feedback ? (
                  <button
                    onClick={submitAnswer}
                    disabled={submitting || !answer.trim()}
                    className="btn-gradient"
                    style={{
                      padding: '11px 28px', borderRadius: '10px', fontWeight: 700,
                      fontSize: '14px', cursor: submitting ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    {submitting
                      ? <><span className="loader-spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%' }} /> Evaluating…</>
                      : <><CheckCircle size={14} /> Submit Answer</>
                    }
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="btn-gradient"
                    style={{ padding: '11px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {qIdx >= session.questions.length - 1 ? '🏁 Finish Session' : <>Next Question <ChevronRight size={14} /></>}
                  </button>
                )}
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className="animate-slide-up glass-card" style={{
                padding: '24px',
                borderColor: feedback.ai_score >= 70 ? 'rgba(16,185,129,0.25)' : feedback.ai_score >= 45 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                  <div style={{
                    fontSize: '36px', fontWeight: 800, lineHeight: 1,
                    color: feedback.ai_score >= 70 ? '#6ee7b7' : feedback.ai_score >= 45 ? '#fcd34d' : '#fca5a5',
                  }}>
                    {feedback.ai_score}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>out of 100</div>
                    <div style={{
                      fontSize: '12px', fontWeight: 700, marginTop: '2px',
                      color: feedback.ai_score >= 70 ? '#6ee7b7' : feedback.ai_score >= 45 ? '#fcd34d' : '#fca5a5',
                    }}>
                      {feedback.ai_score >= 70 ? '✓ Great answer' : feedback.ai_score >= 45 ? '~ Needs improvement' : '✗ Needs work'}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgba(255,255,255,0.7)' }}>
                  {feedback.ai_feedback}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── FINISHED PHASE ── */}
        {phase === 'finished' && (
          <div className="animate-bounce-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Interview Complete!</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>Here's how you performed</p>

            <div style={{ display: 'inline-block', marginBottom: '32px' }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto',
                background: `conic-gradient(${avgScore >= 70 ? '#10b981' : avgScore >= 45 ? '#f59e0b' : '#ef4444'} ${avgScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 32px ${avgScore >= 70 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%',
                  background: '#08080f', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 800 }}>{avgScore}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>avg score</div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
              {answers.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < answers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', flex: 1, marginRight: '12px' }}>
                    {i + 1}. {a.q.substring(0, 65)}…
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    background: a.score >= 70 ? 'rgba(16,185,129,0.15)' : a.score >= 45 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: a.score >= 70 ? '#6ee7b7' : a.score >= 45 ? '#fcd34d' : '#fca5a5',
                  }}>
                    {a.score}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => nav('/dashboard')}
                className="btn-gradient"
                style={{ padding: '12px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <BarChart2 size={14} /> View Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f1f5',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <RotateCcw size={14} /> New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

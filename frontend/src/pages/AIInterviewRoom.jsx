import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';
import { useProfile } from '../context/ProfileContext';
import { Volume2, VolumeX, Clock, Mic, MicOff, Send, BarChart2, RefreshCcw } from 'lucide-react';

const ROUND_META = {
  hr:           { icon: '🤝', title: 'HR Interview',            accent: '#a855f7' },
  technical:    { icon: '⚙️', title: 'Technical Interview',     accent: '#3b82f6' },
  behavioral:   { icon: '🧠', title: 'Behavioral Interview',    accent: '#ec4899' },
  dsa:          { icon: '📊', title: 'DSA Round',               accent: '#f59e0b' },
  system_design:{ icon: '🏗️', title: 'System Design Round',    accent: '#06b6d4' },
};

const DIFF_COLORS = {
  'Easy':                 { bg:'rgba(16,185,129,0.15)',  color:'#10b981' },
  'Intermediate':         { bg:'rgba(245,158,11,0.15)',  color:'#f59e0b' },
  'Intermediate-Hard':    { bg:'rgba(249,115,22,0.15)',  color:'#f97316' },
  'Hard':                 { bg:'rgba(239,68,68,0.15)',   color:'#ef4444' },
  'Very Hard':            { bg:'rgba(168,85,247,0.15)',  color:'#a855f7' },
  'Beginner-Intermediate':{ bg:'rgba(34,197,94,0.15)',   color:'#22c55e' },
};

const COMPANY_CONTEXT = {
  Google:    '🔍 Algorithm depth + distributed systems',
  Amazon:    '📦 Leadership Principles + scalable backend',
  Microsoft: '🪟 System design + growth mindset',
  Netflix:   '🎬 Production reliability + autonomous decisions',
  Meta:      '👥 Product thinking + speed of execution',
  Apple:     '🍎 Quality craft + privacy engineering',
  TCS:       '💼 CS fundamentals + client communication',
  Infosys:   '🏢 Breadth of tech + collaborative problem-solving',
  Adobe:     '🎨 Creative engineering + performance',
  Flipkart:  '🛒 E-commerce scale + data-driven delivery',
};

export default function AIInterviewRoom() {
  const { roundType } = useParams();
  const [searchParams] = useSearchParams();
  const maxQ = parseInt(searchParams.get('questions') || '5');
  const company = searchParams.get('company');
  const role = searchParams.get('role');
  const difficulty = searchParams.get('difficulty');
  const { profile } = useProfile();
  const targetRole = role || profile?.title || profile?.role || null;
  const nav = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [qNum, setQNum] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [timer, setTimer] = useState(0);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const chatRef = useRef(null);
  const recogRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { startSession(); }, []);

  const speak = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95; utt.pitch = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [ttsEnabled]);

  const toggleMic = () => {
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Try Google Chrome.'); return; }
    const recog = new SR();
    recog.continuous = true; recog.interimResults = true; recog.lang = 'en-US';
    let finalText = input;
    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setInput(finalText + interim);
    };
    recog.onend = () => setListening(false);
    recog.onerror = (e) => {
      setListening(false);
      if (e.error !== 'no-speech') alert(`Microphone error: ${e.error}`);
    };
    recogRef.current = recog;
    try { recog.start(); setListening(true); }
    catch (err) { alert('Could not start microphone. Try refreshing the page.'); }
  };

  const startSession = async () => {
    setLoading(true);
    const res = await authFetch('/ai-interview/start', {
      method: 'POST',
      body: JSON.stringify({ round_type: roundType, target_company: company, target_role: targetRole, difficulty }),
    });
    const data = await res.json();
    setSessionId(data.session_id); setQNum(1);
    setMessages([{ role: 'ai', content: data.question, qNum: 1 }]);
    setLoading(false); speak(data.question);
  };

  const submitAnswer = async () => {
    if (!input.trim() || loading) return;
    if (listening) { recogRef.current?.stop(); setListening(false); }
    window.speechSynthesis?.cancel();
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setLoading(true);
    const res = await authFetch('/ai-interview/respond', {
      method: 'POST', body: JSON.stringify({ session_id: sessionId, answer: userMsg.content }),
    });
    const data = await res.json();
    setMessages(prev => [...prev, {
      role: 'feedback', score: data.score, feedback: data.feedback,
      strengths: data.strengths, improvements: data.improvements,
    }]);
    if (qNum >= maxQ) {
      const endRes = await authFetch('/ai-interview/end', {
        method: 'POST', body: JSON.stringify({ session_id: sessionId }),
      });
      setResults(await endRes.json()); setFinished(true); clearInterval(timerRef.current);
    } else {
      setQNum(q => q + 1);
      setMessages(prev => [...prev, { role: 'ai', content: data.next_question, qNum: qNum + 1 }]);
      speak(data.next_question);
    }
    setLoading(false);
  };

  const meta = ROUND_META[roundType] || ROUND_META.hr;
  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');
  const timerUrgent = timer > 2700;

  // ── Results Screen ──
  if (finished && results) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 10 }}>
          <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

          <div className="animate-bounce-in" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '60px', marginBottom: '12px' }}>🎉</div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Interview Complete!</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              {meta.title} · {results.total_questions} questions · {mm}:{ss}
            </p>
          </div>

          {/* Score ring */}
          <div className="glass-card animate-slide-up" style={{ padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 12px',
              background: `conic-gradient(${results.avg_score >= 70 ? '#10b981' : results.avg_score >= 45 ? '#f59e0b' : '#ef4444'} ${results.avg_score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 28px ${results.avg_score >= 70 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              <div style={{
                width: '74px', height: '74px', borderRadius: '50%',
                background: '#08080f', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>{results.avg_score}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>avg score</div>
              </div>
            </div>
          </div>

          {/* Per-answer breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {results.answers?.map((a, i) => (
              <div key={i} className="glass-card animate-slide-up" style={{ padding: '16px', animationDelay: `${i * 0.08}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', flex: 1, marginRight: '12px' }}>
                    Q{i + 1}: {a.question?.substring(0, 65)}…
                  </span>
                  <span style={{
                    padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    background: a.score >= 70 ? 'rgba(16,185,129,0.15)' : a.score >= 45 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: a.score >= 70 ? '#6ee7b7' : a.score >= 45 ? '#fcd34d' : '#fca5a5',
                  }}>
                    {a.score}/100
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', lineHeight: 1.5 }}>{a.feedback}</p>
                {a.strengths?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {a.strengths.map((s, j) => (
                      <span key={j} style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                        background: 'rgba(16,185,129,0.1)', color: '#6ee7b7',
                      }}>✓ {s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => nav('/dashboard')}
              className="btn-gradient"
              style={{ flex: 1, padding: '13px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <BarChart2 size={14} /> Dashboard
            </button>
            <button
              onClick={() => nav('/ai-interview')}
              style={{
                flex: 1, padding: '13px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f1f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <RefreshCcw size={14} /> New Interview
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Live Interview Screen ──
  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', position: 'relative', zIndex: 10 }}>

        {/* Session header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', flexWrap: 'wrap', gap: '8px',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px' }}>{meta.icon}</span>
            <span style={{ fontWeight: 700, color: meta.accent, fontSize: '14px' }}>
              {company ? `${company} · ` : ''}{meta.title}
            </span>
            <span style={{
              fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
            }}>Q{qNum}/{maxQ}</span>
            {role && (
              <span style={{
                fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
                border: `1px solid ${meta.accent}50`, color: meta.accent,
              }}>{role}</span>
            )}
            {difficulty && DIFF_COLORS[difficulty] && (
              <span style={{
                fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
                background: DIFF_COLORS[difficulty].bg,
                color: DIFF_COLORS[difficulty].color,
                fontWeight: 600,
              }}>⚡ {difficulty}</span>
            )}
            {company && COMPANY_CONTEXT[company] && (
              <span style={{
                fontSize: '10px', padding: '2px 10px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                display: window.innerWidth > 640 ? 'inline' : 'none',
              }}>{COMPANY_CONTEXT[company]}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setTtsEnabled(e => !e)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '8px', cursor: 'pointer',
                background: ttsEnabled ? `${meta.accent}20` : 'rgba(255,255,255,0.05)',
                border: ttsEnabled ? `1px solid ${meta.accent}40` : '1px solid rgba(255,255,255,0.1)',
                color: ttsEnabled ? meta.accent : 'rgba(255,255,255,0.4)', fontSize: '11px',
              }}
            >
              {ttsEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
              {ttsEnabled ? 'TTS On' : 'TTS Off'}
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '8px',
              background: timerUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
              border: timerUrgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: timerUrgent ? '#ef4444' : 'rgba(255,255,255,0.6)',
              fontSize: '12px', fontWeight: 700,
              animation: timerUrgent ? 'pulse-glow 1s infinite' : 'none',
            }}>
              <Clock size={11} /> {mm}:{ss}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)' }}>
          <div style={{
            height: '100%', background: `linear-gradient(90deg, ${meta.accent}, #ec4899)`,
            width: `${(qNum / maxQ) * 100}%`, transition: 'width 0.6s ease',
          }} />
        </div>

        {/* Chat messages */}
        <div ref={chatRef} style={{
          flex: 1, overflowY: 'auto', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent',
        }}>
          {messages.map((m, i) => {
            if (m.role === 'ai') return (
              <div key={i} className="animate-slide-up" style={{ display: 'flex', gap: '12px', animationDelay: '0.05s' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${meta.accent}, #ec4899)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, boxShadow: `0 0 12px ${meta.accent}40`,
                }}>AI</div>
                <div className="chat-bubble-ai" style={{ padding: '14px 16px', maxWidth: '75%' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                    Question {m.qNum}
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.65 }}>{m.content}</p>
                  {speaking && i === messages.length - 1 && (
                    <div className="voice-wave" style={{ marginTop: '8px' }}>
                      <span/><span/><span/><span/><span/>
                    </div>
                  )}
                </div>
              </div>
            );

            if (m.role === 'user') return (
              <div key={i} className="animate-slide-up" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <div className="chat-bubble-user" style={{ padding: '14px 16px', maxWidth: '75%' }}>
                  <p style={{ fontSize: '14px', lineHeight: 1.65 }}>{m.content}</p>
                </div>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700,
                }}>You</div>
              </div>
            );

            if (m.role === 'feedback') return (
              <div key={i} className="glass-card animate-slide-up" style={{ margin: '0 48px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '28px', fontWeight: 800, lineHeight: 1,
                    color: m.score >= 70 ? '#6ee7b7' : m.score >= 45 ? '#fcd34d' : '#fca5a5',
                  }}>{m.score}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>/100</span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '8px' }}>{m.feedback}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {m.strengths?.map((s, j) => (
                    <span key={j} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(16,185,129,0.12)', color: '#6ee7b7' }}>✓ {s}</span>
                  ))}
                  {m.improvements?.map((s, j) => (
                    <span key={j} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(245,158,11,0.12)', color: '#fcd34d' }}>↑ {s}</span>
                  ))}
                </div>
              </div>
            );
            return null;
          })}

          {loading && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${meta.accent}, #ec4899)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700,
              }}>AI</div>
              <div className="chat-bubble-ai" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 150, 300].map(delay => (
                    <span key={delay} style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.3)',
                      animation: `bounce 1s ${delay}ms infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', maxWidth: '760px', margin: '0 auto' }}>
            <button
              onClick={toggleMic}
              style={{
                flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                border: listening ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                color: listening ? '#ef4444' : 'rgba(255,255,255,0.5)',
                animation: listening ? 'pulse-glow 1s infinite' : 'none',
              }}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
              placeholder={listening ? '🔴 Listening… speak your answer' : 'Type your answer or click mic to speak…'}
              rows={2}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: '10px', resize: 'none',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f1f1f5', fontSize: '14px', lineHeight: 1.5, outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = `${meta.accent}50`}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />

            <button
              onClick={submitAnswer}
              disabled={!input.trim() || loading}
              className="btn-gradient"
              style={{
                flexShrink: 0, padding: '12px 20px', borderRadius: '10px',
                fontWeight: 700, fontSize: '13px',
                cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <Send size={13} /> Send
            </button>
          </div>
          {listening && (
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#ef4444' }}>
              🔴 Recording… click mic again when done
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

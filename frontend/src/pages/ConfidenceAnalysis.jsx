import { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';

// ─── Constants ───────────────────────────────────────────────────────────────
const FILLERS = ['um','umm','uh','uhh','er','ah','like','you know','basically','actually','literally','honestly','right','so','well','anyway','i mean','sort of','kind of'];
const FILLER_RE = new RegExp(`\\b(${FILLERS.join('|')})\\b`, 'gi');
const IDEAL_WPM_MIN = 120;
const IDEAL_WPM_MAX = 160;
const LONG_PAUSE_MS = 3000;

const sc = v => v >= 75 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-red-400';
const scBg = v => v >= 75 ? 'from-emerald-600 to-emerald-500' : v >= 50 ? 'from-amber-600 to-amber-500' : 'from-red-600 to-red-500';

export default function ConfidenceAnalysis() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Metrics state
  const [totalWords, setTotalWords] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [fillerMap, setFillerMap] = useState({});
  const [wpm, setWpm] = useState(0);
  const [wpmHistory, setWpmHistory] = useState([]);
  const [pauseCount, setPauseCount] = useState(0);
  const [longPauses, setLongPauses] = useState(0);
  const [scores, setScores] = useState({ confidence: 0, fluency: 0, communication: 0, consistency: 0 });

  // Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastSpeechRef = useRef(null);
  const pauseCheckRef = useRef(null);
  const wordCountRef = useRef(0);
  const fillerCountRef = useRef(0);
  const fillerMapRef = useRef({});
  const pauseCountRef = useRef(0);
  const longPauseRef = useRef(0);
  const wpmHistRef = useRef([]);
  const transcriptRef = useRef([]);

  // Check support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // Calculate scores based on real metrics
  const calcScores = useCallback(() => {
    const words = wordCountRef.current;
    const fillers = fillerCountRef.current;
    const pauses = longPauseRef.current;
    const secs = Math.max((Date.now() - (startTimeRef.current || Date.now())) / 1000, 1);
    const currentWpm = Math.round((words / secs) * 60);

    // Filler penalty: >5% filler density is bad
    const fillerDensity = words > 0 ? fillers / words : 0;
    const fillerScore = Math.max(0, 100 - fillerDensity * 500);

    // WPM score: ideal is 120-160, penalty for too fast/slow
    let wpmScore = 100;
    if (currentWpm > 0) {
      if (currentWpm < IDEAL_WPM_MIN) wpmScore = Math.max(20, 100 - (IDEAL_WPM_MIN - currentWpm) * 1.5);
      else if (currentWpm > IDEAL_WPM_MAX) wpmScore = Math.max(20, 100 - (currentWpm - IDEAL_WPM_MAX) * 1.5);
    }

    // Pause penalty
    const pauseScore = Math.max(0, 100 - pauses * 15);

    // WPM consistency (std dev of wpmHistory)
    const hist = wpmHistRef.current;
    let consistencyScore = 100;
    if (hist.length >= 3) {
      const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
      const variance = hist.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / hist.length;
      const stdDev = Math.sqrt(variance);
      consistencyScore = Math.max(20, 100 - stdDev * 2);
    }

    const confidence = Math.round(fillerScore * 0.3 + wpmScore * 0.25 + pauseScore * 0.2 + consistencyScore * 0.25);
    const fluency = Math.round(fillerScore * 0.4 + pauseScore * 0.3 + wpmScore * 0.3);
    const communication = Math.round(wpmScore * 0.35 + consistencyScore * 0.35 + fillerScore * 0.3);

    setScores({
      confidence: Math.min(Math.max(confidence, 0), 100),
      fluency: Math.min(Math.max(fluency, 0), 100),
      communication: Math.min(Math.max(communication, 0), 100),
      consistency: Math.min(Math.max(Math.round(consistencyScore), 0), 100),
    });
    setWpm(currentWpm);
  }, []);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      lastSpeechRef.current = Date.now();
      let interim = '';
      let finalText = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + ' ';
        else interim = t;
      }

      setCurrentText(interim);

      if (finalText.trim()) {
        const words = finalText.trim().split(/\s+/);
        wordCountRef.current += words.length;
        setTotalWords(wordCountRef.current);

        // Filler detection
        const matches = finalText.match(FILLER_RE) || [];
        if (matches.length > 0) {
          fillerCountRef.current += matches.length;
          setFillerCount(fillerCountRef.current);
          matches.forEach(m => {
            const key = m.toLowerCase();
            fillerMapRef.current[key] = (fillerMapRef.current[key] || 0) + 1;
          });
          setFillerMap({ ...fillerMapRef.current });
        }

        // Highlight fillers in transcript
        const highlighted = finalText.trim().replace(FILLER_RE, '<mark>$1</mark>');
        transcriptRef.current = [...transcriptRef.current, { text: finalText.trim(), highlighted, time: Math.round((Date.now() - startTimeRef.current) / 1000) }];
        setTranscript([...transcriptRef.current]);

        calcScores();
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return; // ignore
      console.error('Speech error:', e.error);
    };

    recognition.onend = () => {
      // Auto-restart if still listening
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    startTimeRef.current = Date.now();
    lastSpeechRef.current = Date.now();
    setListening(true);
    setElapsed(0);
    setTranscript([]); setCurrentText('');
    setTotalWords(0); setFillerCount(0); setFillerMap({});
    setWpm(0); setWpmHistory([]); setPauseCount(0); setLongPauses(0);
    setScores({ confidence: 0, fluency: 0, communication: 0, consistency: 0 });
    wordCountRef.current = 0; fillerCountRef.current = 0; fillerMapRef.current = {};
    pauseCountRef.current = 0; longPauseRef.current = 0; wpmHistRef.current = [];
    transcriptRef.current = [];

    // Timer
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);

    // WPM sampling every 10s
    const wpmSampler = setInterval(() => {
      if (!startTimeRef.current) return;
      const secs = (Date.now() - startTimeRef.current) / 1000;
      const curWpm = Math.round((wordCountRef.current / secs) * 60);
      wpmHistRef.current = [...wpmHistRef.current.slice(-19), curWpm];
      setWpmHistory([...wpmHistRef.current]);
      calcScores();
    }, 10000);

    // Pause detection every 1s
    pauseCheckRef.current = setInterval(() => {
      if (!lastSpeechRef.current) return;
      const gap = Date.now() - lastSpeechRef.current;
      if (gap >= LONG_PAUSE_MS) {
        const newPauses = Math.floor(gap / LONG_PAUSE_MS);
        if (newPauses > longPauseRef.current) {
          longPauseRef.current = newPauses;
          setLongPauses(newPauses);
          calcScores();
        }
      }
    }, 1000);

    // Cleanup sampler on stop
    recognitionRef.current._wpmSampler = wpmSampler;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // prevent auto-restart
      ref.stop();
      clearInterval(ref._wpmSampler);
    }
    clearInterval(timerRef.current);
    clearInterval(pauseCheckRef.current);
    setListening(false);
    calcScores();
  };

  useEffect(() => () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    clearInterval(timerRef.current);
    clearInterval(pauseCheckRef.current);
  }, []);

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fillerPct = totalWords > 0 ? ((fillerCount / totalWords) * 100).toFixed(1) : '0.0';
  const paceLabel = wpm === 0 ? 'Waiting...' : wpm < IDEAL_WPM_MIN ? '🐢 Too Slow' : wpm > IDEAL_WPM_MAX ? '🏃 Too Fast' : '✅ Ideal Pace';

  const scoreCards = [
    { label: 'Confidence', value: scores.confidence, icon: '💪', color: '#6c63ff' },
    { label: 'Fluency', value: scores.fluency, icon: '🎯', color: '#10b981' },
    { label: 'Communication', value: scores.communication, icon: '💬', color: '#3b82f6' },
    { label: 'Consistency', value: scores.consistency, icon: '📊', color: '#f59e0b' },
  ];

  const topFillers = Object.entries(fillerMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <><Navbar />
    <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-extrabold mb-1">Speech <span className="text-gradient">Confidence</span> Analysis</h1>
        <p className="text-gray-500 text-sm">Real-time speech analysis powered by AI. Practice speaking and get instant feedback on your communication quality.</p>
      </div>

      {!supported && <div className="glass-card p-5 text-red-400 text-sm mb-6">❌ Your browser doesn't support Speech Recognition. Please use Chrome or Edge.</div>}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6 animate-slide-up" style={{ animationDelay: '.05s' }}>
        {!listening ? (
          <button onClick={startListening} disabled={!supported} className="btn-gradient px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
            <span className="text-lg">🎙️</span> Start Speaking
          </button>
        ) : (
          <button onClick={stopListening} className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
            <span className="text-lg">⏹</span> Stop Session
          </button>
        )}
        {listening && (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"/><span className="font-mono font-semibold text-white">{fmtTime(elapsed)}</span></span>
            <span className="text-gray-600">|</span>
            <span>{totalWords} words</span>
            <span className="text-gray-600">|</span>
            <span>{wpm} WPM</span>
          </div>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-slide-up" style={{ animationDelay: '.1s' }}>
        {scoreCards.map((s, i) => (
          <div key={i} className="glass-card p-4 text-center group hover:border-gray-600 transition-all">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
                <circle cx="32" cy="32" r="27" fill="none" stroke={s.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(s.value)*1.696} 170`} style={{transition:'stroke-dasharray 1s ease'}}/>
              </svg>
              <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${sc(s.value)}`}>{s.value}</div>
            </div>
            <div className="text-xs text-gray-400">{s.icon} {s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-slide-up" style={{ animationDelay: '.15s' }}>

        {/* LEFT: Transcript + Live */}
        <div className="lg:col-span-3 space-y-4">
          {/* Live Transcript */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">{listening && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}📝 Live Transcript</h3>
              <span className="text-[10px] text-gray-600">{transcript.length} segments</span>
            </div>
            <div className="max-h-60 overflow-y-auto pr-1 space-y-2" style={{ scrollbarWidth: 'thin' }}>
              {transcript.length === 0 && !currentText ? (
                <div className="text-center py-10 text-gray-600"><span className="text-3xl opacity-30 block mb-2">🎙️</span><span className="text-xs">Start speaking to see your transcript...</span></div>
              ) : (<>
                {transcript.map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-[10px] font-mono text-gray-600 shrink-0 mt-1">{fmtTime(t.time)}</span>
                    <span className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.highlighted }} />
                  </div>
                ))}
                {currentText && <div className="flex gap-2 text-sm"><span className="text-[10px] font-mono text-gray-600 shrink-0 mt-1">...</span><span className="text-gray-500 italic">{currentText}</span></div>}
              </>)}
            </div>
          </div>

          {/* Speaking Speed */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-3">🏃 Speaking Speed</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-bold">{wpm}</div>
              <div><div className="text-xs text-gray-400">Words per minute</div><div className={`text-xs font-semibold ${wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX ? 'text-emerald-400' : wpm > 0 ? 'text-amber-400' : 'text-gray-500'}`}>{paceLabel}</div></div>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(wpm / 200 * 100, 100)}%`, background: wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)' }}/>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600"><span>0</span><span className="text-emerald-400/50">120-160 ideal</span><span>200+</span></div>
            {wpmHistory.length > 1 && <div className="mt-3 flex items-end gap-0.5 h-12">
              {wpmHistory.map((w, i) => (<div key={i} className="flex-1 rounded-t" style={{ height: `${Math.min(w / 200 * 100, 100)}%`, background: w >= IDEAL_WPM_MIN && w <= IDEAL_WPM_MAX ? '#10b981' : w < IDEAL_WPM_MIN ? '#3b82f6' : '#f59e0b', opacity: 0.7, minHeight: '2px' }} title={`${w} WPM`}/>))}
            </div>}
          </div>

          {/* Hesitation / Pauses */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-3">⏸️ Pause & Hesitation</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-white/3">
                <div className={`text-xl font-bold ${longPauses > 3 ? 'text-red-400' : longPauses > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>{longPauses}</div>
                <div className="text-[10px] text-gray-500 mt-1">Long Pauses (3s+)</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/3">
                <div className="text-xl font-bold text-gray-300">{totalWords > 0 ? Math.round(elapsed / Math.max(transcript.length, 1)) : 0}s</div>
                <div className="text-[10px] text-gray-500 mt-1">Avg Segment Gap</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/3">
                <div className={`text-xl font-bold ${scores.consistency >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{scores.consistency}%</div>
                <div className="text-[10px] text-gray-500 mt-1">Pacing Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Analytics Sidebar */}
        <div className="lg:col-span-2 space-y-4">

          {/* Confidence Gauge */}
          <div className="glass-card p-5 text-center">
            <h3 className="text-sm font-bold mb-3">💪 Confidence Meter</h3>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
                <circle cx="64" cy="64" r="54" fill="none" stroke="url(#confGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${scores.confidence * 3.393} 340`} style={{transition:'stroke-dasharray 1.2s ease'}}/>
                <defs><linearGradient id="confGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6c63ff"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl font-bold ${sc(scores.confidence)}`}>{scores.confidence}</div>
                <div className="text-[10px] text-gray-500">/ 100</div>
              </div>
            </div>
            <div className={`text-xs font-semibold ${sc(scores.confidence)}`}>
              {scores.confidence >= 75 ? '🌟 Excellent Confidence!' : scores.confidence >= 50 ? '👍 Good, keep improving' : scores.confidence > 0 ? '💡 Needs improvement' : 'Start speaking to analyze'}
            </div>
          </div>

          {/* Filler Words */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">🚫 Filler Words</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${parseFloat(fillerPct) > 5 ? 'bg-red-500/15 text-red-400' : parseFloat(fillerPct) > 2 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>{fillerPct}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/3 text-center"><div className="text-lg font-bold text-red-400">{fillerCount}</div><div className="text-[10px] text-gray-500">Total Fillers</div></div>
              <div className="p-2 rounded-lg bg-white/3 text-center"><div className="text-lg font-bold">{totalWords}</div><div className="text-[10px] text-gray-500">Total Words</div></div>
            </div>
            {topFillers.length > 0 && (
              <div className="space-y-1.5">
                {topFillers.map(([word, count]) => (
                  <div key={word} className="flex items-center gap-2">
                    <span className="text-xs text-red-300 font-mono w-16 truncate">"{word}"</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-red-500/60" style={{ width: `${Math.min(count / Math.max(fillerCount, 1) * 100, 100)}%` }}/></div>
                    <span className="text-[10px] text-gray-500 w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
            {topFillers.length === 0 && <div className="text-center py-4 text-gray-600 text-xs">No fillers detected yet</div>}
          </div>

          {/* Tips */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-3">💡 Real-Time Tips</h3>
            <div className="space-y-2">
              {wpm > 0 && wpm < IDEAL_WPM_MIN && <Tip icon="🐢" text="You're speaking too slowly. Try to pick up the pace slightly." type="warning"/>}
              {wpm > IDEAL_WPM_MAX && <Tip icon="🏃" text="You're speaking too fast. Slow down for better clarity." type="warning"/>}
              {wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX && wpm > 0 && <Tip icon="✅" text="Great speaking pace! Keep it up." type="success"/>}
              {parseFloat(fillerPct) > 5 && <Tip icon="🚫" text={`High filler rate (${fillerPct}%). Pause silently instead of using fillers.`} type="error"/>}
              {parseFloat(fillerPct) > 0 && parseFloat(fillerPct) <= 5 && <Tip icon="👍" text="Filler usage is within acceptable range." type="success"/>}
              {longPauses > 3 && <Tip icon="⏸️" text="Too many long pauses. Try to maintain a steady flow." type="warning"/>}
              {longPauses <= 1 && totalWords > 20 && <Tip icon="🎯" text="Excellent flow with minimal hesitation!" type="success"/>}
              {totalWords === 0 && <Tip icon="🎙️" text="Start speaking to get real-time analysis..." type="info"/>}
            </div>
          </div>
        </div>
      </div>
    </div></>
  );
}

function Tip({ icon, text, type }) {
  const colors = { success: 'border-emerald-500/15 bg-emerald-500/5', warning: 'border-amber-500/15 bg-amber-500/5', error: 'border-red-500/15 bg-red-500/5', info: 'border-gray-500/15 bg-gray-500/5' };
  return (<div className={`flex items-start gap-2 p-2 rounded-lg border text-xs text-gray-300 ${colors[type]}`}><span>{icon}</span><span>{text}</span></div>);
}

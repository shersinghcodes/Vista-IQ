import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';

const EMOJI = { neutral:'😐', happy:'😊', sad:'😢', angry:'😠', surprised:'😲', fearful:'😨', disgusted:'🤢' };
const BAR_COLORS = {
  neutral:  { bar: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
  happy:    { bar: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  sad:      { bar: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  angry:    { bar: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  surprised:{ bar: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  fearful:  { bar: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  disgusted:{ bar: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
};
const EMOTIONS = Object.keys(EMOJI);
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const TIPS = [
  { emoji: '😊', title: 'Stay Positive', text: 'Maintain a warm, natural smile to show confidence and approachability.' },
  { emoji: '👀', title: 'Eye Contact', text: 'Look directly at the camera to simulate strong eye contact with the interviewer.' },
  { emoji: '🧘', title: 'Stay Calm', text: 'Take deep breaths between answers to keep a composed, neutral expression.' },
  { emoji: '🎯', title: 'Be Engaged', text: 'Show interest with subtle nods and attentive expressions.' },
];

export default function EmotionDetection() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [bars, setBars] = useState({});
  const [dominant, setDominant] = useState({ name: 'neutral', emoji: '😐', conf: 0 });
  const [timeline, setTimeline] = useState([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const faceapiRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastLogRef = useRef(0);
  const timerRef = useRef(null);

  /* Load face-api.js from CDN */
  useEffect(() => {
    if (window.faceapi) { faceapiRef.current = window.faceapi; loadModels(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
    script.onload = () => { faceapiRef.current = window.faceapi; loadModels(); };
    script.onerror = () => setModelError('Failed to load face-api.js library');
    document.head.appendChild(script);
  }, []);

  const loadModels = async () => {
    try {
      const fa = faceapiRef.current;
      await fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await fa.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch (e) { setModelError(e.message); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setStreaming(true);
      startTimeRef.current = Date.now();
      setTimeline([]);
      setElapsedSec(0);
      lastLogRef.current = 0;
      timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
      videoRef.current.onplaying = () => startDetection();
    } catch { alert('Camera access denied.'); }
  };

  const stopCamera = () => {
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStreaming(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const startDetection = () => {
    const fa = faceapiRef.current;
    const opts = new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current?.videoWidth) return;
      const dets = await fa.detectAllFaces(videoRef.current, opts).withFaceExpressions();
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (!dets.length) { setBars({}); return; }
      const ex = dets[0].expressions;
      const box = dets[0].detection.box;
      ctx.strokeStyle = '#6c63ff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      let best = 'neutral', bestV = 0;
      for (const [k, v] of Object.entries(ex)) { if (v > bestV) { bestV = v; best = k; } }
      setDominant({ name: best, emoji: EMOJI[best], conf: bestV });
      setBars(ex);
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (elapsed - lastLogRef.current >= 3) {
        lastLogRef.current = elapsed;
        setTimeline(prev => [...prev.slice(-14), { time: elapsed, emotion: best, conf: bestV }]);
      }
    }, 500);
  };

  useEffect(() => () => { clearInterval(intervalRef.current); clearInterval(timerRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const fmtTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative" style={{ background: 'var(--color-bg)' }}>
        {/* Background orbs */}
        <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* ── Header ── */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Emotion <span className="text-gradient">Detection</span>
            </h1>
            <p className="text-gray-400 text-base max-w-xl">
              Real-time facial expression analysis powered by AI. Practice your interview presence and get instant feedback on your emotional composure.
            </p>
          </div>

          {/* ── Status Bar ── */}
          <div className="mb-6 animate-slide-up" style={{ animationDelay: '.05s' }}>
            {!modelsLoaded && !modelError && (
              <div className="glass-card flex items-center gap-3 px-5 py-3 text-sm text-gray-300">
                <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" />
                Loading AI face detection models…
              </div>
            )}
            {modelError && (
              <div className="glass-card flex items-center gap-3 px-5 py-3 text-sm text-red-400 border-red-500/20">
                <span className="text-lg">❌</span> {modelError}
              </div>
            )}
            {modelsLoaded && !streaming && (
              <div className="glass-card flex items-center gap-3 px-5 py-3 text-sm text-emerald-400 border-emerald-500/20">
                <span className="text-lg">✅</span> AI models loaded — click <strong>Start Camera</strong> to begin.
              </div>
            )}
          </div>

          {/* ── Controls ── */}
          <div className="mb-6 flex flex-wrap items-center gap-4 animate-slide-up" style={{ animationDelay: '.1s' }}>
            {!streaming ? (
              <button
                disabled={!modelsLoaded}
                onClick={startCamera}
                className="btn-gradient px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="text-lg">📷</span> Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <span className="text-lg">⏹</span> Stop Camera
              </button>
            )}
            {streaming && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono font-semibold text-white">{fmtTime(elapsedSec)}</span>
                </span>
                <span className="text-gray-600">|</span>
                <span>{timeline.length} emotion logs</span>
              </div>
            )}
          </div>

          {/* ── Main Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up" style={{ animationDelay: '.15s' }}>

            {/* ── LEFT: Webcam ── */}
            <div className="lg:col-span-3">
              <div className="glass-card overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: '4 / 3', background: '#0a0a14' }}>
                  {!streaming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                      <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <span className="text-4xl opacity-40">📷</span>
                      </div>
                      <span className="text-sm font-medium">Camera Preview</span>
                      <span className="text-xs text-gray-600">Click "Start Camera" to begin</span>
                    </div>
                  )}
                  <video
                    ref={videoRef} autoPlay muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ display: streaming ? 'block' : 'none', transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {streaming && (
                    <>
                      {/* LIVE badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400">LIVE</span>
                      </div>
                      {/* Dominant emotion badge */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl">
                        <span className="text-3xl">{dominant.emoji}</span>
                        <div>
                          <div className="font-bold text-white capitalize text-sm">{dominant.name}</div>
                          <div className="text-xs font-mono" style={{ color: BAR_COLORS[dominant.name]?.bar || '#6c63ff' }}>
                            {Math.round(dominant.conf * 100)}% confidence
                          </div>
                        </div>
                      </div>
                      {/* Timer */}
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-mono font-semibold text-gray-300">
                        ⏱ {fmtTime(elapsedSec)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Tips Cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {TIPS.map((tip, i) => (
                  <div key={i} className="glass-card p-3 hover:border-white/10 transition-colors group cursor-default">
                    <div className="text-xl mb-1.5">{tip.emoji}</div>
                    <div className="text-xs font-semibold text-white mb-0.5 group-hover:text-purple-300 transition-colors">{tip.title}</div>
                    <div className="text-[11px] text-gray-500 leading-relaxed">{tip.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Analytics Sidebar ── */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Emotion Levels Card */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">📊</span>
                  <h3 className="text-sm font-bold text-white tracking-wide">Live Emotion Levels</h3>
                </div>
                <div className="space-y-3">
                  {EMOTIONS.map(e => {
                    const val = Math.round((bars[e] || 0) * 100);
                    const isTop = dominant.name === e && streaming;
                    return (
                      <div key={e} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium capitalize flex items-center gap-1.5 ${isTop ? 'text-white' : 'text-gray-400'}`}>
                            <span className="text-sm">{EMOJI[e]}</span> {e}
                          </span>
                          <span className={`text-xs font-mono font-semibold ${isTop ? 'text-white' : 'text-gray-500'}`}>
                            {val}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: BAR_COLORS[e].bg }}>
                          <div
                            className="h-full rounded-full emo-bar-fill"
                            style={{
                              width: `${val}%`,
                              background: isTop
                                ? `linear-gradient(90deg, ${BAR_COLORS[e].bar}, ${BAR_COLORS[e].bar}cc)`
                                : BAR_COLORS[e].bar,
                              boxShadow: isTop ? `0 0 12px ${BAR_COLORS[e].bar}40` : 'none',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Stats */}
              {streaming && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-card p-3 text-center">
                    <div className="text-lg font-bold text-white">{timeline.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Samples</div>
                  </div>
                  <div className="glass-card p-3 text-center">
                    <div className="text-lg">{dominant.emoji}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Current</div>
                  </div>
                  <div className="glass-card p-3 text-center">
                    <div className="text-lg font-bold" style={{ color: BAR_COLORS[dominant.name]?.bar }}>
                      {Math.round(dominant.conf * 100)}%
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Confidence</div>
                  </div>
                </div>
              )}

              {/* Timeline Card */}
              <div className="glass-card p-5 flex-1 min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🕒</span>
                    <h3 className="text-sm font-bold text-white tracking-wide">Emotion Timeline</h3>
                  </div>
                  {timeline.length > 0 && (
                    <span className="text-[10px] text-gray-600 font-mono">{timeline.length} entries</span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto pr-1 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                  {timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                      <span className="text-3xl mb-2 opacity-30">🕒</span>
                      <span className="text-xs">Start camera to see timeline</span>
                    </div>
                  ) : (
                    [...timeline].reverse().map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <span className="text-[10px] font-mono text-gray-500 w-10 shrink-0">{fmtTime(t.time)}</span>
                        <span className="text-base">{EMOJI[t.emotion]}</span>
                        <span className="text-xs font-medium text-gray-300 capitalize flex-1">{t.emotion}</span>
                        <span
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: BAR_COLORS[t.emotion].bg, color: BAR_COLORS[t.emotion].bar }}
                        >
                          {Math.round(t.conf * 100)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Insight Card */}
              {streaming && timeline.length >= 3 && (() => {
                const counts = {};
                timeline.forEach(t => counts[t.emotion] = (counts[t.emotion] || 0) + 1);
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const topEmo = sorted[0]?.[0] || 'neutral';
                const topPct = Math.round((sorted[0]?.[1] / timeline.length) * 100);
                const advice = {
                  happy: "Great! You're projecting confidence and warmth.",
                  neutral: "Good composure, but try adding more expressiveness.",
                  sad: "You seem a bit down. Try sitting up straight and smiling.",
                  angry: "Watch your expression — try relaxing your jaw and forehead.",
                  surprised: "Looking surprised is OK sometimes, but stay composed.",
                  fearful: "Take a deep breath. You've got this!",
                  disgusted: "Be mindful of your expression. Stay neutral and open.",
                };
                return (
                  <div className="glass-card p-5 border-purple-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">💡</span>
                      <h3 className="text-sm font-bold text-white tracking-wide">Session Insight</h3>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: BAR_COLORS[topEmo].bg }}>
                        {EMOJI[topEmo]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white capitalize">{topEmo}</div>
                        <div className="text-xs text-gray-500">Dominant emotion • {topPct}% of the time</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{advice[topEmo]}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

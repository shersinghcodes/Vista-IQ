import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { authFetch } from '../api';
import { Clock, Play, Send, RotateCcw, ChevronLeft } from 'lucide-react';

const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

export default function CodingSession() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [lang, setLang] = useState('python');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const editorRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    authFetch(`/coding/problems/${id}`).then(r => r.json()).then(setProblem);
    timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [id]);

  const getCode = () => editorRef.current?.getValue() || '';
  const starterCode = problem ? (lang === 'python' ? problem.starter_python : problem.starter_js) : '';

  const runCode = async () => {
    setRunning(true);
    const res = await authFetch('/coding/run', {
      method: 'POST',
      body: JSON.stringify({ problem_id: +id, language: lang, code: getCode() }),
    });
    setResults(await res.json()); setRunning(false);
  };

  const submitCode = async () => {
    setRunning(true);
    const res = await authFetch('/coding/submit', {
      method: 'POST',
      body: JSON.stringify({ problem_id: +id, language: lang, code: getCode() }),
    });
    setResults(await res.json()); setRunning(false);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const timerUrgent = elapsed > 2700;

  if (!problem) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div className="loader-spin" style={{ width: '28px', height: '28px', border: '3px solid rgba(108,99,255,0.2)', borderTopColor: '#6c63ff', borderRadius: '50%' }} />
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Loading problem…</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gridTemplateRows: '54px 1fr 210px', height: '100vh', background: '#08080f', overflow: 'hidden' }}>

      {/* ── Top Bar ── */}
      <div style={{
        gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0 16px', background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <a
          href="/coding"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
            borderRadius: '7px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none', fontSize: '12px', fontWeight: 500,
          }}
        >
          <ChevronLeft size={13} /> Back
        </a>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>{problem.title}</span>
          <span style={{
            padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
            background: `${DIFF_COLORS[problem.difficulty] || '#6c63ff'}20`,
            color: DIFF_COLORS[problem.difficulty] || '#a5b4fc',
          }}>
            {problem.difficulty}
          </span>
        </div>

        {/* Language select */}
        <select
          value={lang} onChange={e => setLang(e.target.value)}
          style={{
            padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f1f1f5', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="python">🐍 Python</option>
          <option value="javascript">🟡 JavaScript</option>
        </select>

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', borderRadius: '7px',
          background: timerUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
          border: timerUrgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: timerUrgent ? '#ef4444' : 'rgba(255,255,255,0.7)',
          fontSize: '13px', fontWeight: 700,
          animation: timerUrgent ? 'pulse-glow 1s infinite' : 'none',
        }}>
          <Clock size={12} /> {mm}:{ss}
        </div>

        {/* Action buttons */}
        <button
          onClick={() => editorRef.current?.setValue(starterCode)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
            borderRadius: '7px', fontSize: '12px', fontWeight: 600,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>

        <button
          onClick={runCode} disabled={running}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px',
            borderRadius: '7px', fontSize: '12px', fontWeight: 600,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            color: running ? 'rgba(255,255,255,0.3)' : '#6ee7b7', cursor: running ? 'wait' : 'pointer',
          }}
        >
          <Play size={11} /> Run
        </button>

        <button
          onClick={submitCode} disabled={running}
          className="btn-gradient"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 16px',
            borderRadius: '7px', fontSize: '12px', fontWeight: 700,
            cursor: running ? 'wait' : 'pointer',
          }}
        >
          <Send size={11} /> Submit
        </button>
      </div>

      {/* ── Problem Panel ── */}
      <div style={{
        gridRow: '2 / 4', overflowY: 'auto', padding: '20px',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>{problem.title}</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
            background: `${DIFF_COLORS[problem.difficulty] || '#6c63ff'}20`,
            color: DIFF_COLORS[problem.difficulty] || '#a5b4fc',
          }}>
            {problem.difficulty}
          </span>
          {(problem.tags || []).map(t => (
            <span key={t} style={{
              padding: '3px 10px', borderRadius: '6px', fontSize: '11px',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
            }}>{t}</span>
          ))}
        </div>

        <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
          {problem.description}
        </div>

        {(problem.examples || []).map((ex, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '12px', marginBottom: '10px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Example {i + 1}
            </div>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Input: </span>
              <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{ex.input}</code>
            </div>
            <div style={{ fontSize: '13px', marginBottom: ex.explanation ? '4px' : 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Output: </span>
              <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{ex.output}</code>
            </div>
            {ex.explanation && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{ex.explanation}</div>
            )}
          </div>
        ))}

        {problem.constraints && (
          <>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', marginTop: '16px' }}>Constraints</h4>
            <ul style={{ paddingLeft: '18px', margin: 0 }}>
              {problem.constraints.map((c, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{c}</li>
              ))}
            </ul>
          </>
        )}

        {problem.hints && (
          <>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', marginTop: '16px' }}>Hints</h4>
            {problem.hints.map((h, i) => (
              <details key={i} style={{ marginBottom: '6px' }}>
                <summary style={{ fontSize: '13px', color: '#a5b4fc', cursor: 'pointer', padding: '4px 0' }}>
                  Hint {i + 1}
                </summary>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', paddingLeft: '12px', marginTop: '6px' }}>{h}</p>
              </details>
            ))}
          </>
        )}
      </div>

      {/* ── Editor ── */}
      <div style={{ gridRow: 2, overflow: 'hidden' }}>
        <Editor
          defaultValue={starterCode}
          language={lang === 'javascript' ? 'javascript' : 'python'}
          theme="vs-dark"
          onMount={(editor) => { editorRef.current = editor; }}
          options={{
            fontSize: 14, minimap: { enabled: false }, wordWrap: 'on',
            padding: { top: 16 }, scrollBeyondLastLine: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
          }}
        />
      </div>

      {/* ── Results Panel ── */}
      <div style={{
        overflowY: 'auto', padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}>
        {running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
            <div className="loader-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(108,99,255,0.2)', borderTopColor: '#6c63ff', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Running code…</span>
          </div>
        )}
        {results && !running && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{
                padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                background: results.status === 'accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: results.status === 'accepted' ? '#6ee7b7' : results.status === 'tle' ? '#fcd34d' : '#fca5a5',
                border: `1px solid ${results.status === 'accepted' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
                {results.status === 'accepted' ? '✅ Accepted' : results.status === 'tle' ? '⏱ TLE' : '❌ Wrong Answer'}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {results.passed}/{results.total} test cases passed
              </span>
            </div>

            {(results.results || []).map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: r.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: r.passed ? '#6ee7b7' : '#fca5a5', fontSize: '11px', fontWeight: 700,
                }}>
                  {r.passed ? '✓' : '✗'}
                </div>
                <div style={{ flex: 1, fontSize: '12px' }}>
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>In: </span>
                    <code style={{ color: 'rgba(255,255,255,0.7)' }}>{r.input}</code>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Expected: </span>
                    <code style={{ color: 'rgba(255,255,255,0.7)' }}>{r.expected}</code>
                    {!r.passed && <>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}> · Got: </span>
                      <code style={{ color: '#fca5a5' }}>{r.actual || '(none)'}</code>
                    </>}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{r.runtime_ms}ms</span>
              </div>
            ))}

            {results.ai_feedback && (
              <div style={{
                marginTop: '12px', padding: '12px 14px', borderRadius: '10px',
                background: results.status === 'accepted' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${results.status === 'accepted' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
              }}>
                {results.ai_feedback}
              </div>
            )}
          </>
        )}
        {!results && !running && (
          <p style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
            Run your code to see results.
          </p>
        )}
      </div>
    </div>
  );
}

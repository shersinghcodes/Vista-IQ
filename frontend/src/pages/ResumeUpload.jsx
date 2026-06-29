import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, authFetchFormData } from '../api';
import Navbar from '../components/Navbar';

export default function ResumeUpload() {
  const [resumes, setResumes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analyzingId, setAnalyzingId] = useState(null);
  const fileRef = useRef(null);

  const fetchData = useCallback(() => {
    authFetch('/resume/list').then(r => r.json()).then(setResumes).catch(() => {});
    authFetch('/resume/analytics/summary').then(r => r.json()).then(setAnalytics).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (file) => {
    if (!file) return;
    setError('');
    setSuccess('');

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress (real progress would need XMLHttpRequest)
    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + Math.random() * 20, 90));
    }, 200);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetchFormData('/resume/upload', fd);
      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Upload failed');
      }

      setUploadProgress(100);
      setSuccess(`"${file.name}" uploaded successfully!`);
      fetchData();
      setTimeout(() => { setUploadProgress(0); setUploading(false); }, 1200);
    } catch (e) {
      clearInterval(progressInterval);
      setError(e.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleUpload(file);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume?')) return;
    await authFetch(`/resume/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAnalyze = async (id) => {
    setAnalyzingId(id);
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`/resume/${id}/analyze`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('✅ Analysis complete! Redirecting to results...');
        fetchData();
        setTimeout(() => {
          window.location.href = `/resume/${id}/analysis`;
        }, 1200);
      } else {
        setError(data.detail || 'Analysis failed. Please try again.');
      }
    } catch (e) {
      setError(e.message || 'Cannot connect to server. Is the backend running?');
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const scoreColor = (score) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold">📄 Resume Analyzer</h1>
            <p className="text-gray-500 mt-1">Upload, analyze, and optimize your resume with AI</p>
          </div>
        </div>

        {/* Stats Row */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <StatCard icon="📄" label="Resumes" value={analytics.total_resumes} />
            <StatCard icon="🔍" label="Analyses" value={analytics.total_analyses} />
            <StatCard icon="🏆" label="Best Score" value={analytics.best_score || '—'} />
            <StatCard icon="📊" label="Avg Score" value={analytics.avg_score || '—'} />
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
            ❌ {error}
            <button onClick={() => setError('')} className="float-right text-red-400 hover:text-red-300">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-slide-up">
            ✅ {success}
            <button onClick={() => setSuccess('')} className="float-right text-emerald-400 hover:text-emerald-300">✕</button>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className={`glass-card p-8 mb-6 text-center cursor-pointer transition-all duration-300 animate-slide-up upload-zone ${dragOver ? 'upload-zone-active' : ''}`}
          style={{ animationDelay: '0.1s' }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          id="resume-upload-zone"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />

          {uploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-3xl animate-bounce-in">
                📤
              </div>
              <p className="text-gray-400">Uploading...</p>
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-300 upload-progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{Math.round(uploadProgress)}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border-2 border-dashed border-violet-500/30 flex items-center justify-center text-3xl upload-icon">
                📄
              </div>
              <div>
                <p className="text-lg font-semibold">Drop your resume here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse · PDF only · Max 5MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Latest Scores */}
        {analytics?.latest_scores && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            {[
              { label: 'Overall', value: analytics.latest_scores.overall, gradient: 'from-violet-500 to-purple-500' },
              { label: 'ATS', value: analytics.latest_scores.ats, gradient: 'from-blue-500 to-cyan-500' },
              { label: 'Technical', value: analytics.latest_scores.technical, gradient: 'from-emerald-500 to-green-500' },
              { label: 'Projects', value: analytics.latest_scores.project, gradient: 'from-amber-500 to-yellow-500' },
              { label: 'Communication', value: analytics.latest_scores.communication, gradient: 'from-pink-500 to-rose-500' },
            ].map((s, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      className={`score-ring`}
                      stroke="url(#g-${i})"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(s.value || 0) * 1.76} 176`}
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                    <defs>
                      <linearGradient id={`g-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" className={`score-ring-start-${i}`} />
                        <stop offset="100%" className={`score-ring-end-${i}`} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {s.value != null ? Math.round(s.value) : '—'}
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Resume History */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold mb-3">📂 Your Resumes</h2>
          {resumes.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-500">
              <p className="text-4xl mb-3">📭</p>
              <p>No resumes uploaded yet. Upload your first resume above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((r, i) => (
                <div key={r.id} className="glass-card p-4 flex items-center gap-4 hover:border-gray-600 transition-all animate-slide-up" style={{ animationDelay: `${0.25 + i * 0.05}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center text-lg shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{r.original_filename}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      v{r.version} · {formatSize(r.file_size)} · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {r.has_analysis && r.overall_score != null && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreColor(r.overall_score)}`}>
                      {Math.round(r.overall_score)}/100
                    </span>
                  )}
                  <div className="flex gap-2 shrink-0">
                    {r.has_analysis ? (
                      <Link
                        to={`/resume/${r.id}/analysis`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-all"
                      >
                        📊 View Analysis
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleAnalyze(r.id)}
                        disabled={analyzingId === r.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium btn-gradient disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {analyzingId === r.id ? (
                          <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full loader-spin" /> Analyzing...</>
                        ) : '🔍 Analyze'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div><div className="text-xl font-extrabold">{value ?? '—'}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}

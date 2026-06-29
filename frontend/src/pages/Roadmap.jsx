import { useState, useEffect } from 'react';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';

const COMPANIES = ['Product Company', 'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Startup', 'Service Company'];
const sc = v => v >= 70 ? 'text-emerald-400' : v >= 40 ? 'text-amber-400' : 'text-red-400';
const scBg = v => v >= 70 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500';
const prioBg = { critical: 'bg-red-500/15 text-red-400 border-red-500/20', high: 'bg-amber-500/15 text-amber-400 border-amber-500/20', medium: 'bg-blue-500/15 text-blue-400 border-blue-500/20', low: 'bg-gray-500/15 text-gray-400 border-gray-500/20' };

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState('Product Company');
  const [weeks, setWeeks] = useState(8);
  const [tab, setTab] = useState('overview');
  const [expandedWeek, setExpandedWeek] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await authFetch(`/roadmap/generate?company=${encodeURIComponent(company)}&role=SDE&weeks=${weeks}`);
      const d = await r.json();
      setRoadmap(d);
      setTab('overview');
    } catch { }
    setLoading(false);
  };

  useEffect(() => { generate(); }, []);

  const tabs = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'weekly', icon: '📅', label: 'Weekly Plan' },
    { key: 'weaknesses', icon: '🎯', label: 'Weaknesses' },
    { key: 'resources', icon: '📚', label: 'Resources' },
  ];

  return (
    <><Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">AI <span className="text-gradient">Roadmap</span></h1>
            <p className="text-gray-500 text-sm">Personalized preparation plan based on your performance analytics</p>
          </div>
        </div>

        {/* Config Bar */}
        <div className="glass-card p-4 mb-5 flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">🏢 Target:</span>
            <select value={company} onChange={e => setCompany(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500/50 text-gray-300">
              {COMPANIES.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">📅 Weeks:</span>
            <select value={weeks} onChange={e => setWeeks(+e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500/50 text-gray-300">
              {[4, 6, 8, 10, 12].map(w => (<option key={w} value={w}>{w} weeks</option>))}
            </select>
          </div>
          <button onClick={generate} disabled={loading} className="btn-gradient px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
            {loading ? '⏳ Generating...' : '🚀 Generate Roadmap'}
          </button>
        </div>

        {loading && <div className="flex items-center justify-center py-20 gap-3 text-gray-500"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" /><span className="text-sm">Analyzing your data & building roadmap...</span></div>}

        {roadmap && !loading && <>
          {/* Readiness + Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card p-4 text-center">
              <div className="relative w-14 h-14 mx-auto mb-2">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56"><circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" /><circle cx="28" cy="28" r="23" fill="none" stroke={roadmap.readiness_score >= 70 ? '#10b981' : roadmap.readiness_score >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${roadmap.readiness_score * 1.445} 145`} /></svg>
                <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${sc(roadmap.readiness_score)}`}>{roadmap.readiness_score}</div>
              </div>
              <div className="text-[10px] text-gray-500">Readiness Score</div>
            </div>
            <div className="glass-card p-4 text-center"><div className="text-2xl font-bold text-violet-400">{roadmap.total_weeks}</div><div className="text-[10px] text-gray-500 mt-1">Weeks Plan</div></div>
            <div className="glass-card p-4 text-center"><div className="text-2xl font-bold">{roadmap.weaknesses?.length || 0}</div><div className="text-[10px] text-gray-500 mt-1">Weak Areas</div></div>
            <div className="glass-card p-4 text-center"><div className="text-2xl font-bold text-emerald-400">{roadmap.resources?.length || 0}</div><div className="text-[10px] text-gray-500 mt-1">Resources</div></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-5 flex-wrap animate-slide-up" style={{ animationDelay: '0.12s' }}>
            {tabs.map(t => (<button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{t.icon} {t.label}</button>))}
          </div>

          {/* OVERVIEW */}
          {tab === 'overview' && <div className="space-y-4">
            {/* Milestones */}
            <div className="glass-card p-5 animate-slide-up"><h3 className="text-sm font-bold mb-4">🏁 Milestones</h3>
              <div className="flex flex-wrap gap-3">
                {roadmap.milestones?.map((m, i) => (<div key={i} className="flex-1 min-w-[140px] p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                  <div className="text-[10px] text-violet-400 font-semibold mb-1">Week {m.week}</div>
                  <div className="text-xs font-bold mb-0.5">{m.title}</div>
                  <div className="text-[10px] text-gray-500">{m.desc}</div>
                </div>))}
              </div>
            </div>

            {/* Company Info */}
            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <h3 className="text-sm font-bold mb-3">🏢 {roadmap.target_company} - {roadmap.target_role}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/3 text-center"><div className="text-xs font-bold">{roadmap.company_info?.interview_rounds}</div><div className="text-[10px] text-gray-500">Rounds</div></div>
                <div className="p-3 rounded-lg bg-white/3 text-center"><div className="text-xs font-bold capitalize">{roadmap.company_info?.coding_level}</div><div className="text-[10px] text-gray-500">Coding Level</div></div>
                <div className="p-3 rounded-lg bg-white/3 text-center"><div className="text-xs font-bold">{roadmap.company_info?.primary?.length}</div><div className="text-[10px] text-gray-500">Focus Areas</div></div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">{roadmap.company_info?.primary?.map(t => (<span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">{t}</span>))}</div>
            </div>

            {/* Quick Weakness Summary */}
            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-sm font-bold mb-3">🎯 Top Weak Areas</h3>
              <div className="space-y-2">{roadmap.weaknesses?.slice(0, 5).map((w, i) => (<div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${prioBg[w.priority]}`}>{w.priority}</span>
                <span className="text-xs font-medium flex-1">{w.topic}{w.subtopic ? ` - ${w.subtopic}` : ''}</span>
                <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className={`h-full rounded-full ${scBg(w.score)}`} style={{ width: `${w.score}%` }} /></div>
                <span className={`text-xs font-bold ${sc(w.score)}`}>{w.score}%</span>
              </div>))}</div>
            </div>
          </div>}

          {/* WEEKLY PLAN */}
          {tab === 'weekly' && <div className="space-y-3">
            {roadmap.weekly_plan?.map((week, i) => (<div key={i} className="animate-slide-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <div onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)} className={`glass-card p-4 cursor-pointer transition-all hover:border-violet-500/20 ${expandedWeek === week.week ? 'border-violet-500/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">W{week.week}</div>
                    <div><div className="text-sm font-bold">{week.phase}</div>
                      <div className="flex gap-1.5 mt-1">{week.focus_topics?.map(t => (<span key={t.key || t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{t.icon} {t.name}</span>))}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0"><div className="text-xs text-gray-400">🎯 {week.coding_target} problems</div><div className="text-[10px] text-gray-600">{expandedWeek === week.week ? '▲' : '▼'}</div></div>
                </div>
              </div>
              {expandedWeek === week.week && <div className="glass-card p-4 mt-1 border-violet-500/15 animate-slide-up">
                <h4 className="text-xs font-bold text-gray-400 mb-2">📋 Goals</h4>
                <ul className="text-xs text-gray-400 list-disc list-inside mb-3">{week.goals?.map((g, j) => (<li key={j}>{g}</li>))}</ul>
                <h4 className="text-xs font-bold text-gray-400 mb-2">📅 Daily Tasks</h4>
                <div className="grid grid-cols-7 gap-1.5">
                  {week.daily_tasks?.map((day, j) => (<div key={j} className="p-2 rounded-lg bg-white/3 border border-white/5">
                    <div className="text-[10px] font-bold text-violet-400 mb-1">{day.day_label}</div>
                    {day.tasks?.map((task, k) => (<div key={k} className="text-[9px] text-gray-400 mb-0.5"><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${task.type === 'study' ? 'bg-blue-400' : task.type === 'practice' ? 'bg-emerald-400' : task.type === 'revision' ? 'bg-amber-400' : 'bg-purple-400'}`} />{task.title.length > 25 ? task.title.slice(0, 25) + '...' : task.title}</div>))}
                  </div>))}
                </div>
              </div>}
            </div>))}
          </div>}

          {/* WEAKNESSES */}
          {tab === 'weaknesses' && <div className="space-y-3">
            {roadmap.weaknesses?.map((w, i) => (<div key={i} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${prioBg[w.priority]}`}>{w.priority}</span>
                <div className="flex-1"><div className="text-sm font-bold">{w.topic}{w.subtopic ? ` - ${w.subtopic}` : ''}</div><div className="text-xs text-gray-500">{w.reason}</div></div>
                <div className="text-right"><div className={`text-lg font-bold ${sc(w.score)}`}>{w.score}%</div></div>
              </div>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${scBg(w.score)}`} style={{ width: `${w.score}%` }} /></div>
            </div>))}
          </div>}

          {/* RESOURCES */}
          {tab === 'resources' && <div className="grid md:grid-cols-2 gap-3">
            {roadmap.resources?.map((r, i) => (<a key={i} href={r.url} target="_blank" rel="noreferrer" className="glass-card p-4 hover:border-violet-500/20 transition-all animate-slide-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{r.type === 'video' ? '🎥' : r.type === 'practice' ? '💻' : r.type === 'course' ? '📖' : '📄'}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold mb-0.5">{r.title}</div>
                  <div className="text-xs text-gray-500">{r.topic_name}</div>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 capitalize">{r.type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 capitalize">{r.level}</span>
                  </div>
                  {r.reason && <div className="text-[10px] text-gray-600 mt-1">💡 {r.reason}</div>}
                </div>
                <span className="text-gray-600 text-sm">↗</span>
              </div>
            </a>))}
            {(!roadmap.resources || roadmap.resources.length === 0) && <div className="col-span-2 glass-card p-10 text-center text-gray-500">No specific resources recommended yet</div>}
          </div>}
        </>}
      </div></>
  );
}

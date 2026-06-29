import { useState, useEffect } from 'react';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';
import { useProfile } from '../context/ProfileContext';

const sc = v => v >= 75 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-red-400';
const scBg = v => v >= 75 ? 'bg-emerald-500' : v >= 50 ? 'bg-amber-500' : 'bg-red-500';
const tierColor = t => ({FAANG:'from-violet-600 to-purple-600',Product:'from-blue-600 to-cyan-600',Startup:'from-emerald-600 to-teal-600',Service:'from-gray-600 to-slate-600'}[t]||'from-violet-600 to-purple-600');
const ROLES = ['SDE','Backend Engineer','Full Stack Engineer','Frontend Engineer','ML Engineer','Data Engineer','DevOps Engineer'];
const TABS = [{k:'overview',i:'🎯',l:'Overview'},{k:'companies',i:'🏢',l:'Companies'},{k:'gaps',i:'⚡',l:'Skill Gap'},{k:'salary',i:'💰',l:'Salary'},{k:'recs',i:'📚',l:'Recommendations'},{k:'compare',i:'⚖️',l:'Compare'}];

function ScoreRing({value,size=64,stroke=5,color='#a855f7'}) {
  const r = (size-stroke*2)/2, circ = 2*Math.PI*r, dash = circ*(value/100);
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{transition:'stroke-dasharray 1s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size>56?14:11,fontWeight:700,color}}>{value}%</div>
    </div>
  );
}

function StatCard({icon,label,value,sub,color='text-violet-400'}) {
  return (
    <div className="glass-card p-4 text-center">
      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
      {sub&&<div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function JobMatching() {
  const { profile } = useProfile();
  const profileRole = profile?.title || profile?.role || 'SDE';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [role, setRole] = useState(profileRole);
  const [exp, setExp] = useState(0);
  const [error, setError] = useState('');
  const [savedCos, setSavedCos] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const r = await authFetch('/job-match/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target_role:role,experience_years:exp})});
      const d = await r.json();
      if (!r.ok) { setError(d.detail||'Failed to generate'); setLoading(false); return; }
      setReport(d); setTab('overview');
    } catch { setError('Cannot connect to server.'); }
    setLoading(false);
  };

  const saveCompany = async (co) => {
    await authFetch('/job-match/favorites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:co.company,role:co.role,fit_score:co.fit_score})});
    setSavedCos(p=>[...p,co.company]);
  };

  const doCompare = async () => {
    if (compareList.length < 2) return;
    setComparing(true);
    const r = await authFetch('/job-match/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companies:compareList,role})});
    const d = await r.json();
    setCompareResult(d); setComparing(false);
  };

  const toggleCompare = (name) => setCompareList(p => p.includes(name) ? p.filter(x=>x!==name) : p.length<3 ? [...p,name] : p);

  useEffect(() => {
    if (profileRole && role === 'SDE') setRole(profileRole);
  }, [profileRole]);

  useEffect(()=>{ generate(); },[]);

  const hp = report?.hiring_probability || {};
  const gaps = report?.skill_gap_analysis || {};
  const matches = report?.top_company_matches || [];
  const roleOptions = ROLES.includes(role) ? ROLES : [role, ...ROLES];

  return (<><Navbar/>
    <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">AI <span className="text-gradient">Job Match</span></h1>
          <p className="text-gray-500 text-sm">AI-powered job recommendations based on your resume, skills & performance</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 mb-5 flex flex-wrap items-center gap-3 animate-slide-up" style={{animationDelay:'0.05s'}}>
        <select value={role} onChange={e=>setRole(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500/50 text-gray-300">
          {roleOptions.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select value={exp} onChange={e=>setExp(+e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500/50 text-gray-300">
          {[0,1,2,3,5,7].map(y=><option key={y} value={y}>{y===0?'Fresher / Intern':`${y}+ Years Exp`}</option>)}
        </select>
        <button onClick={generate} disabled={loading} className="btn-gradient px-5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 ml-auto">
          {loading?'⏳ Analyzing...':'🚀 Generate Match'}
        </button>
      </div>

      {error && <div className="glass-card p-4 mb-4 text-red-400 text-sm border-red-500/20">{error} {error.includes('resume')&&<a href="/resume" className="underline text-violet-400 ml-2">→ Analyze Resume</a>}</div>}
      {loading && <div className="flex items-center justify-center py-20 gap-3 text-gray-500"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin"/><span className="text-sm">AI analyzing your profile across {Object.keys({}).length||13} companies...</span></div>}

      {report && !loading && <>
        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-slide-up" style={{animationDelay:'0.1s'}}>
          <StatCard icon="🏆" label="Top Match" value={`${report.top_match_score||0}%`} sub={report.top_match_company} color="text-violet-400"/>
          <StatCard icon="📊" label="Hiring Probability" value={`${hp.hiring_probability||0}%`} sub={hp.placement_readiness} color={sc(hp.hiring_probability||0)}/>
          <StatCard icon="🚀" label="Startup Fit" value={`${report.startup_fit_score||0}%`} sub="Startup readiness" color="text-emerald-400"/>
          <StatCard icon="🌐" label="Remote Fit" value={`${report.remote_suitability_score||0}%`} sub="Remote suitability" color="text-blue-400"/>
        </div>

        {/* AI Career Summary */}
        {report.career_summary && (
          <div className="glass-card p-4 mb-5 border-violet-500/20 animate-slide-up" style={{animationDelay:'0.12s'}}>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">🤖</span>
              <div><div className="text-xs font-semibold text-violet-400 mb-1">AI Career Summary</div><p className="text-sm text-gray-300 leading-relaxed">{report.career_summary}</p></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 flex-wrap animate-slide-up" style={{animationDelay:'0.14s'}}>
          {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab===t.k?'bg-violet-500/20 text-violet-300 border border-violet-500/30':'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{t.i} {t.l}</button>)}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab==='overview' && <div className="space-y-4">
          {/* Hiring Probability Breakdown */}
          <div className="glass-card p-5 animate-slide-up">
            <h3 className="text-sm font-bold mb-4">📈 Hiring Probability Breakdown</h3>
            <div className="space-y-3">
              {hp.factors && Object.entries(hp.factors).map(([k,v])=>(
                <div key={k} className="flex items-center gap-3">
                  <div className="text-xs text-gray-400 w-32 shrink-0 capitalize">{k.replace(/_/g,' ')} <span className="text-gray-600">({v.weight})</span></div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${scBg(v.score||0)}`} style={{width:`${v.score||0}%`}}/>
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${sc(v.score||0)}`}>{v.score||0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {report.ai_insights?.length>0 && (
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.05s'}}>
              <h3 className="text-sm font-bold mb-3">💡 AI Insights</h3>
              <div className="space-y-2">
                {report.ai_insights.map((ins,i)=>(
                  <div key={i} className={`p-3 rounded-xl flex gap-3 items-start ${ins.type==='strength'?'bg-emerald-500/8 border border-emerald-500/15':ins.type==='warning'?'bg-amber-500/8 border border-amber-500/15':'bg-blue-500/8 border border-blue-500/15'}`}>
                    <span>{ins.type==='strength'?'✅':ins.type==='warning'?'⚠️':'🎯'}</span>
                    <div><div className="text-xs font-semibold mb-0.5">{ins.title}</div><div className="text-[11px] text-gray-400">{ins.description}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 3 AI Recommendations */}
          {report.top_3_recommendations?.length>0 && (
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.1s'}}>
              <h3 className="text-sm font-bold mb-3">🏅 Top Picks for You</h3>
              <div className="space-y-3">
                {report.top_3_recommendations.map((rec,i)=>(
                  <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/5 flex gap-3 items-start">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${i===0?'from-yellow-500 to-amber-600':i===1?'from-gray-400 to-gray-600':'from-amber-700 to-orange-800'} flex items-center justify-center text-xs font-bold shrink-0`}>{i+1}</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">{rec.company} <span className="text-gray-500 font-normal text-xs">— {rec.role}</span></div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{rec.reason}</div>
                      <div className="text-[10px] text-violet-400 mt-1">→ {rec.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>}

        {/* ── COMPANIES TAB ── */}
        {tab==='companies' && <div className="grid md:grid-cols-2 gap-3">
          {matches.map((co,i)=>(
            <div key={i} className="glass-card p-4 animate-slide-up hover:border-violet-500/25 transition-all" style={{animationDelay:`${0.04*i}s`}}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tierColor(co.tier)} flex items-center justify-center text-sm font-bold shrink-0`}>{co.badge}</div>
                  <div>
                    <div className="text-sm font-bold">{co.company}</div>
                    <div className="text-[10px] text-gray-500">{co.role} · {co.tier}</div>
                  </div>
                </div>
                <ScoreRing value={co.fit_score||0} size={52} stroke={4} color={co.accent||'#a855f7'}/>
              </div>

              {/* Score bars */}
              <div className="space-y-1.5 mb-3">
                {[['Skill Match',co.skill_match],['ATS Match',co.ats_match],['Tech Ready',co.technical_readiness],['Hiring Prob',co.hiring_probability]].map(([l,v])=>(
                  <div key={l} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-20 shrink-0">{l}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scBg(v||0)}`} style={{width:`${v||0}%`}}/>
                    </div>
                    <span className={`text-[10px] font-bold w-8 text-right ${sc(v||0)}`}>{v||0}%</span>
                  </div>
                ))}
              </div>

              {/* Salary */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 p-2 rounded-lg bg-white/3 text-center">
                  <div className="text-[10px] text-gray-500">Intern/mo</div>
                  <div className="text-xs font-bold text-emerald-400">₹{((co.salary_inr?.intern||[0])[0]/1000).toFixed(0)}K–{((co.salary_inr?.intern||[0,0])[1]/1000).toFixed(0)}K</div>
                </div>
                <div className="flex-1 p-2 rounded-lg bg-white/3 text-center">
                  <div className="text-[10px] text-gray-500">Fresher/yr</div>
                  <div className="text-xs font-bold text-violet-400">₹{((co.salary_inr?.fresher||[0])[0]/100000).toFixed(1)}L–{((co.salary_inr?.fresher||[0,0])[1]/100000).toFixed(1)}L</div>
                </div>
              </div>

              {/* Missing skills */}
              {co.missing_skills?.length>0 && (
                <div className="mb-3"><div className="text-[10px] text-gray-500 mb-1">Missing skills:</div>
                  <div className="flex flex-wrap gap-1">{co.missing_skills.slice(0,4).map(s=><span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/15">{s}</span>)}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <button onClick={()=>saveCompany(co)} disabled={savedCos.includes(co.company)} className={`flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all ${savedCos.includes(co.company)?'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default':'bg-white/5 hover:bg-violet-500/15 hover:text-violet-300 border border-white/10 text-gray-400'}`}>
                  {savedCos.includes(co.company)?'✓ Saved':'♡ Save'}
                </button>
                <button onClick={()=>toggleCompare(co.company)} className={`flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all border ${compareList.includes(co.company)?'bg-violet-500/20 text-violet-300 border-violet-500/30':'bg-white/5 hover:bg-violet-500/10 border-white/10 text-gray-400'}`}>
                  {compareList.includes(co.company)?'✓ Compare':'+ Compare'}
                </button>
              </div>
            </div>
          ))}
        </div>}

        {/* ── SKILL GAP TAB ── */}
        {tab==='gaps' && <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 animate-slide-up">
            <div className="glass-card p-4 text-center">
              <ScoreRing value={gaps.match_percentage||0} size={64} stroke={5} color={sc(gaps.match_percentage||0)==='text-emerald-400'?'#10b981':sc(gaps.match_percentage||0)==='text-amber-400'?'#f59e0b':'#ef4444'}/>
              <div className="text-xs text-gray-400 mt-2">Skill Match</div>
            </div>
            <div className="glass-card p-4 text-center"><div className={`text-3xl font-bold ${sc(100-((gaps.missing_skills||[]).length*10))}`}>{(gaps.missing_skills||[]).length}</div><div className="text-xs text-gray-400 mt-1">Missing Skills</div></div>
            <div className="glass-card p-4 text-center"><div className="text-3xl font-bold text-amber-400">{(gaps.missing_keywords||[]).length}</div><div className="text-xs text-gray-400 mt-1">Missing Keywords</div></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.05s'}}>
              <h3 className="text-sm font-bold mb-3">❌ Missing Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {(gaps.missing_skills||[]).map(s=><span key={s} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/15">{s}</span>)}
                {!(gaps.missing_skills||[]).length && <span className="text-xs text-gray-500">All required skills present! 🎉</span>}
              </div>
            </div>
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.07s'}}>
              <h3 className="text-sm font-bold mb-3">✅ Matched Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {(gaps.matched_skills||[]).map(s=><span key={s} className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">{s}</span>)}
              </div>
            </div>
          </div>

          {(gaps.weak_areas||[]).length>0 && (
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.1s'}}>
              <h3 className="text-sm font-bold mb-3">⚠️ Weak Areas</h3>
              <div className="space-y-2">{gaps.weak_areas.map((w,i)=><div key={i} className="p-2 rounded-lg bg-amber-500/8 border border-amber-500/15 text-xs text-amber-300">{typeof w==='string'?w:JSON.stringify(w)}</div>)}</div>
            </div>
          )}

          {(gaps.missing_keywords||[]).length>0 && (
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.12s'}}>
              <h3 className="text-sm font-bold mb-3">🔍 Missing ATS Keywords</h3>
              <div className="flex flex-wrap gap-1.5">{gaps.missing_keywords.map(k=><span key={k} className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">{k}</span>)}</div>
            </div>
          )}

          {(gaps.weak_interview_topics||[]).length>0 && (
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.14s'}}>
              <h3 className="text-sm font-bold mb-3">🎤 Weak Interview Topics</h3>
              <div className="flex flex-wrap gap-1.5">{gaps.weak_interview_topics.map(t=><span key={t} className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/15">{t}</span>)}</div>
            </div>
          )}
        </div>}

        {/* ── SALARY TAB ── */}
        {tab==='salary' && <div className="space-y-4">
          <div className="glass-card p-5 animate-slide-up">
            <h3 className="text-sm font-bold mb-4">💰 Salary Predictions by Company</h3>
            <div className="space-y-4">
              {(report.salary_predictions||[]).map((s,i)=>(
                <div key={i} className="animate-slide-up" style={{animationDelay:`${0.05*i}s`}}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold">{s.company}</span>
                    <span className="text-xs text-gray-500">{exp===0?'Intern':'Fresher'} estimate</span>
                  </div>
                  <div className="relative h-8 bg-white/3 rounded-xl overflow-hidden border border-white/5">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600/40 to-purple-600/40 rounded-xl transition-all" style={{width:`${Math.min(((exp===0?s.intern_monthly_inr:s.fresher_annual_inr)||[0,0])[1]/300000*100,100)}%`}}/>
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-bold text-violet-300">₹{exp===0?`${((s.intern_monthly_inr||[0])[0]/1000).toFixed(0)}K–${((s.intern_monthly_inr||[0,0])[1]/1000).toFixed(0)}K/mo`:`${((s.fresher_annual_inr||[0])[0]/100000).toFixed(1)}L–${((s.fresher_annual_inr||[0,0])[1]/100000).toFixed(1)}L/yr`}</span>
                      <span className="text-[10px] text-gray-500">{s.currency||'INR'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 animate-slide-up" style={{animationDelay:'0.1s'}}>
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold mb-3">🎓 Internship Range (Top Match)</h3>
              {(report.salary_predictions||[]).slice(0,1).map(s=>(
                <div key={s.company}>
                  <div className="text-3xl font-bold text-emerald-400 mb-1">₹{((s.intern_monthly_inr||[0])[0]/1000).toFixed(0)}K–{((s.intern_monthly_inr||[0,0])[1]/1000).toFixed(0)}K</div>
                  <div className="text-xs text-gray-500">per month · {s.company}</div>
                </div>
              ))}
            </div>
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold mb-3">💼 Fresher Package (Top Match)</h3>
              {(report.salary_predictions||[]).slice(0,1).map(s=>(
                <div key={s.company}>
                  <div className="text-3xl font-bold text-violet-400 mb-1">₹{((s.fresher_annual_inr||[0])[0]/100000).toFixed(1)}L–{((s.fresher_annual_inr||[0,0])[1]/100000).toFixed(1)}L</div>
                  <div className="text-xs text-gray-500">per year · {s.company}</div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ── RECOMMENDATIONS TAB ── */}
        {tab==='recs' && <div className="space-y-4">
          {(report.learning_recommendations||[]).length>0 && (
            <div className="glass-card p-5 animate-slide-up">
              <h3 className="text-sm font-bold mb-4">📚 Learning Resources to Close Gaps</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {report.learning_recommendations.map((r,i)=>(
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/3 border border-white/5 hover:border-violet-500/20 transition-all flex gap-3 items-start">
                    <span className="text-xl">{r.type==='video'?'🎥':r.type==='course'?'📖':r.type==='certification'?'🏆':r.type==='practice'?'💻':'📄'}</span>
                    <div><div className="text-xs font-semibold">{r.skill}</div><div className="text-[11px] text-gray-400">{r.resource}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block capitalize ${r.type==='certification'?'bg-yellow-500/15 text-yellow-400':'bg-violet-500/10 text-violet-300'}`}>{r.type}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {(report.interview_prep_plan||[]).length>0 && (
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.05s'}}>
              <h3 className="text-sm font-bold mb-4">🎯 Interview Prep Plan</h3>
              <div className="space-y-2">
                {report.interview_prep_plan.map((p,i)=>(
                  <div key={i} className={`p-3 rounded-xl flex gap-3 items-center border ${p.priority==='high'?'bg-red-500/8 border-red-500/15':p.priority==='medium'?'bg-amber-500/8 border-amber-500/15':'bg-blue-500/8 border-blue-500/15'}`}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${p.priority==='high'?'bg-red-500/20 text-red-400':p.priority==='medium'?'bg-amber-500/20 text-amber-400':'bg-blue-500/20 text-blue-400'}`}>{p.priority}</span>
                    <div className="flex-1"><div className="text-xs font-semibold">{p.topic}</div><div className="text-[11px] text-gray-400">{p.resources}</div></div>
                    <div className="text-[10px] text-gray-600 shrink-0">{p.days_needed}d</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(report.project_ideas||[]).length>0 && (
            <div className="glass-card p-5 animate-slide-up" style={{animationDelay:'0.1s'}}>
              <h3 className="text-sm font-bold mb-4">💡 Project Ideas to Boost Profile</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {report.project_ideas.map((p,i)=>(
                  <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="text-xs font-bold mb-1">🛠 {p.title}</div>
                    <div className="flex flex-wrap gap-1 mb-1.5">{(p.tech_stack||[]).map(t=><span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300">{t}</span>)}</div>
                    <div className="text-[11px] text-gray-400">{p.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>}

        {/* ── COMPARE TAB ── */}
        {tab==='compare' && <div className="space-y-4">
          <div className="glass-card p-5 animate-slide-up">
            <h3 className="text-sm font-bold mb-3">⚖️ Compare Companies</h3>
            <p className="text-xs text-gray-500 mb-3">Select 2–3 companies from the Companies tab, then hit Compare.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {matches.slice(0,8).map(co=>(
                <button key={co.company} onClick={()=>toggleCompare(co.company)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${compareList.includes(co.company)?'bg-violet-500/20 text-violet-300 border-violet-500/30':'bg-white/3 text-gray-400 border-white/10 hover:border-violet-500/20'}`}>
                  {compareList.includes(co.company)?'✓ ':''}{co.company}
                </button>
              ))}
            </div>
            <button onClick={doCompare} disabled={compareList.length<2||comparing} className="btn-gradient px-5 py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
              {comparing?'Comparing...':`Compare ${compareList.length} Companies`}
            </button>
          </div>

          {compareResult?.comparisons && (
            <div className="overflow-x-auto animate-slide-up" style={{animationDelay:'0.05s'}}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold w-40">Metric</th>
                    {compareResult.comparisons.map(co=>(
                      <th key={co.company} className="text-center py-3 px-4">
                        <div className="font-bold text-sm">{co.company}</div>
                        <div className="text-[10px] text-gray-500">{co.tier}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[['Fit Score','fit_score'],['Skill Match','skill_match'],['ATS Match','ats_match'],['Tech Ready','technical_readiness'],['Hiring Prob','hiring_probability'],['Role Compat','role_compatibility']].map(([label,key])=>(
                    <tr key={key} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-2.5 px-4 text-gray-400">{label}</td>
                      {compareResult.comparisons.map(co=>{
                        const best = Math.max(...compareResult.comparisons.map(c=>c[key]||0));
                        const v = co[key]||0;
                        return <td key={co.company} className="py-2.5 px-4 text-center">
                          <span className={`font-bold ${sc(v)} ${v===best?'underline decoration-dotted':''}`}>{v}%</span>
                        </td>;
                      })}
                    </tr>
                  ))}
                  <tr className="border-b border-white/5">
                    <td className="py-2.5 px-4 text-gray-400">Coding Level</td>
                    {compareResult.comparisons.map(co=><td key={co.company} className="py-2.5 px-4 text-center capitalize text-gray-300">{co.coding_level}</td>)}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-gray-400">Rounds</td>
                    {compareResult.comparisons.map(co=><td key={co.company} className="py-2.5 px-4 text-center text-gray-300">{co.interview_rounds}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>}
      </>}
    </div>
  </>);
}

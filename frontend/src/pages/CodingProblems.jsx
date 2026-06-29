import { useState, useEffect } from 'react';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';

const CATS = [
  {key:'all',label:'All Topics'},{key:'arrays',label:'Arrays'},{key:'strings',label:'Strings'},
  {key:'linked_lists',label:'Linked Lists'},{key:'trees',label:'Trees/Graphs'},
  {key:'dynamic_programming',label:'DP'},{key:'design',label:'Design'},
];
const COMPANIES = ['all','Google','Amazon','Meta','Microsoft','Apple','Goldman Sachs'];
const DC = {easy:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',medium:'bg-amber-500/10 text-amber-400 border-amber-500/20',hard:'bg-red-500/10 text-red-400 border-red-500/20'};

export default function CodingProblems() {
  const [problems, setProblems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [companyPaths, setCompanyPaths] = useState({});
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState('all');
  const [cat, setCat] = useState('all');
  const [company, setCompany] = useState('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('problems');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch('/coding/problems').then(r=>r.json()),
      authFetch('/coding/analytics').then(r=>r.json()),
      authFetch('/coding/roadmap').then(r=>r.json()),
      authFetch('/coding/company-paths').then(r=>r.json()),
    ]).then(([p,a,r,c])=>{setProblems(p);setAnalytics(a);setRoadmap(r);setCompanyPaths(c);})
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = problems
    .filter(p=>diff==='all'||p.difficulty===diff)
    .filter(p=>cat==='all'||p.category===cat)
    .filter(p=>company==='all'||p.companies?.includes(company))
    .filter(p=>!search||p.title.toLowerCase().includes(search.toLowerCase())||p.tags?.some(t=>t.includes(search.toLowerCase())));

  const toggleBookmark = async (id) => {
    await authFetch('/coding/bookmark',{method:'POST',body:JSON.stringify({problem_id:id})});
    setProblems(prev=>prev.map(p=>p.id===id?{...p,bookmarked:!p.bookmarked}:p));
  };

  const loadDetail = async (id) => {
    if (expandedId===id){setExpandedId(null);setDetail(null);return;}
    const r = await authFetch(`/coding/problems/${id}`);
    const d = await r.json();
    setDetail(d);setExpandedId(id);
  };

  const tabs = [
    {key:'problems',icon:'📚',label:'Problems'},
    {key:'roadmap',icon:'🗺️',label:'DSA Roadmap'},
    {key:'companies',icon:'🏢',label:'Company Prep'},
    {key:'bookmarks',icon:'⭐',label:'Bookmarks'},
  ];

  return (
    <><Navbar/>
    <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Coding <span className="text-gradient">Prep</span></h1>
          <p className="text-gray-500 text-sm">Master DSA with curated problems, AI hints, and direct practice links</p>
        </div>
        {tab==='problems'&&<div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input placeholder="Search problems…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full sm:w-72 pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-[var(--color-accent)] transition-colors placeholder-gray-600"/>
        </div>}
      </div>

      {/* Stats */}
      {analytics&&<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5 animate-slide-up" style={{animationDelay:'0.05s'}}>
        <StatCard icon="📚" label="Total" value={analytics.total_problems}/>
        <StatCard icon="✅" label="Solved" value={analytics.problems_solved} color="text-emerald-400"/>
        <StatCard icon="🟢" label="Easy" value={`${analytics.easy?.solved||0}/${analytics.easy?.total||0}`}/>
        <StatCard icon="🟡" label="Medium" value={`${analytics.medium?.solved||0}/${analytics.medium?.total||0}`}/>
        <StatCard icon="🔴" label="Hard" value={`${analytics.hard?.solved||0}/${analytics.hard?.total||0}`}/>
      </div>}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap animate-slide-up" style={{animationDelay:'0.1s'}}>
        {tabs.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab===t.key?'bg-violet-500/20 text-violet-300 border border-violet-500/30':'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{t.icon} {t.label}</button>))}
      </div>

      {/* ═══ PROBLEMS TAB ═══ */}
      {tab==='problems'&&<>
        <div className="flex flex-wrap gap-2 mb-3">
          {['all','easy','medium','hard'].map(d=>(<button key={d} onClick={()=>setDiff(d)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${diff===d?'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-white':'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>{d==='all'?'All Levels':d.charAt(0).toUpperCase()+d.slice(1)}</button>))}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {CATS.map(c=>(<button key={c.key} onClick={()=>setCat(c.key)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${cat===c.key?'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-white':'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>{c.label}</button>))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {COMPANIES.map(c=>(<button key={c} onClick={()=>setCompany(c)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${company===c?'border-violet-500 bg-violet-500/15 text-violet-300':'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>{c==='all'?'🏢 All Companies':c}</button>))}
        </div>

        {loading?<div className="flex items-center justify-center py-20 gap-3 text-gray-500"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin"/><span className="text-sm">Loading…</span></div>
        :<div className="space-y-3">
          {filtered.map((p,i)=>(
            <div key={p.id} className="animate-slide-up" style={{animationDelay:`${0.03*i}s`}}>
              <div className={`glass-card p-4 transition-all duration-300 hover:border-purple-500/20 ${expandedId===p.id?'border-violet-500/30':''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 font-mono w-6">#{p.id}</span>
                  <button onClick={()=>loadDetail(p.id)} className="flex-1 text-left">
                    <span className="font-bold text-sm hover:text-white transition-colors">{p.title}</span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.companies?.slice(0,2).map(c=>(<span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/15 hidden sm:inline">{c}</span>))}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${DC[p.difficulty]||''}`}>{p.difficulty}</span>
                    <button onClick={()=>toggleBookmark(p.id)} className="text-lg hover:scale-110 transition-transform">{p.bookmarked?'⭐':'☆'}</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                  {(p.tags||[]).map(t=>(<span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-gray-500">{t}</span>))}
                </div>

                {/* Practice Links */}
                {p.links&&<div className="flex gap-2 mt-2 ml-9">
                  {p.links.leetcode&&<a href={p.links.leetcode} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 hover:bg-amber-500/20 transition-all">LeetCode ↗</a>}
                  {p.links.gfg&&<a href={p.links.gfg} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 transition-all">GFG ↗</a>}
                  {p.links.hackerrank&&<a href={p.links.hackerrank} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15 hover:bg-blue-500/20 transition-all">HackerRank ↗</a>}
                </div>}
              </div>

              {/* Expanded Detail */}
              {expandedId===p.id&&detail&&<div className="glass-card p-5 mt-1 border-violet-500/20 animate-slide-up">
                <p className="text-sm text-gray-300 mb-3 whitespace-pre-line">{detail.description}</p>
                {detail.examples?.map((ex,i)=>(<div key={i} className="p-3 rounded-lg bg-white/3 border border-white/5 mb-2 text-xs"><div><strong className="text-gray-400">Input:</strong> <code className="text-violet-300">{ex.input}</code></div><div><strong className="text-gray-400">Output:</strong> <code className="text-emerald-300">{ex.output}</code></div>{ex.explanation&&<div className="text-gray-500 mt-1">{ex.explanation}</div>}</div>))}
                {detail.approach&&<div className="mt-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15"><h4 className="text-xs font-bold text-violet-400 mb-1">🧠 AI Approach</h4><pre className="text-xs text-gray-300 whitespace-pre-wrap">{detail.approach}</pre><div className="flex gap-3 mt-2 text-[10px]"><span className="text-emerald-400">⏱ {detail.time_complexity}</span><span className="text-blue-400">💾 {detail.space_complexity}</span></div></div>}
                {detail.hints&&<div className="mt-3"><h4 className="text-xs font-bold text-amber-400 mb-1">💡 Hints</h4>{detail.hints.map((h,i)=>(<details key={i} className="text-xs text-gray-400 mb-1"><summary className="cursor-pointer hover:text-gray-300">Hint {i+1}</summary><p className="pl-4 pt-1">{h}</p></details>))}</div>}
                {detail.constraints&&<div className="mt-3"><h4 className="text-xs font-bold text-gray-500 mb-1">Constraints</h4><ul className="text-xs text-gray-500 list-disc list-inside">{detail.constraints.map((c,i)=>(<li key={i}>{c}</li>))}</ul></div>}
              </div>}
            </div>
          ))}
          {filtered.length===0&&<div className="text-center py-16"><div className="text-4xl mb-3 opacity-30">🔍</div><p className="text-gray-500 text-sm">No problems match.</p><button onClick={()=>{setDiff('all');setCat('all');setCompany('all');setSearch('');}} className="mt-3 text-xs text-violet-400 hover:underline">Clear filters</button></div>}
        </div>}
      </>}

      {/* ═══ ROADMAP TAB ═══ */}
      {tab==='roadmap'&&<div className="space-y-3">
        {roadmap.map((week,i)=>(<div key={i} className="glass-card p-5 animate-slide-up" style={{animationDelay:`${0.05*i}s`}}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">W{week.week}</div>
            <div><h3 className="font-bold text-sm">{week.title}</h3><div className="flex gap-1.5 mt-1">{week.topics.map(t=>(<span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{t}</span>))}</div></div>
          </div>
          <div className="flex flex-wrap gap-2 ml-13">
            {week.problems.map(pid=>{const p=problems.find(x=>x.id===pid);return p?(<span key={pid} className={`text-xs px-2 py-0.5 rounded border ${DC[p.difficulty]}`}>{p.title}</span>):null;})}
          </div>
        </div>))}
      </div>}

      {/* ═══ COMPANIES TAB ═══ */}
      {tab==='companies'&&<div className="grid md:grid-cols-2 gap-4">
        {Object.entries(companyPaths).map(([name,path],i)=>(<div key={name} className="glass-card p-5 animate-slide-up" style={{animationDelay:`${0.05*i}s`}}>
          <h3 className="font-bold text-lg mb-1">{name}</h3>
          <p className="text-xs text-gray-400 mb-3">{path.tips}</p>
          <div className="mb-3"><h4 className="text-xs font-bold text-violet-400 mb-1">Focus Areas</h4><div className="flex flex-wrap gap-1.5">{path.focus.map(f=>(<span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">{f}</span>))}</div></div>
          <h4 className="text-xs font-bold text-gray-400 mb-1">Recommended Problems</h4>
          <div className="flex flex-wrap gap-1.5">{path.problems.map(pid=>{const p=problems.find(x=>x.id===pid);return p?(<span key={pid} className={`text-[10px] px-2 py-0.5 rounded border ${DC[p.difficulty]}`}>{p.title}</span>):null;})}</div>
        </div>))}
      </div>}

      {/* ═══ BOOKMARKS TAB ═══ */}
      {tab==='bookmarks'&&<div className="space-y-3">
        {problems.filter(p=>p.bookmarked).length===0?<div className="glass-card p-10 text-center"><p className="text-3xl mb-3">⭐</p><p className="text-gray-500">No bookmarked problems yet. Star problems to save them here!</p></div>
        :problems.filter(p=>p.bookmarked).map((p,i)=>(
          <div key={p.id} className="glass-card p-4 flex items-center gap-3 animate-slide-up" style={{animationDelay:`${0.03*i}s`}}>
            <span className="text-xs text-gray-600 font-mono">#{p.id}</span>
            <span className="flex-1 font-bold text-sm">{p.title}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${DC[p.difficulty]}`}>{p.difficulty}</span>
            <div className="flex gap-1.5">
              {p.links?.leetcode&&<a href={p.links.leetcode} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">LeetCode ↗</a>}
              {p.links?.gfg&&<a href={p.links.gfg} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">GFG ↗</a>}
            </div>
            <button onClick={()=>toggleBookmark(p.id)} className="text-lg">⭐</button>
          </div>
        ))}
      </div>}
    </div></>
  );
}

function StatCard({icon,label,value,color=''}){
  return(<div className="glass-card px-4 py-3 flex items-center gap-3"><span className="text-xl">{icon}</span><div><div className={`text-lg font-bold ${color}`}>{value}</div><div className="text-xs text-gray-500">{label}</div></div></div>);
}

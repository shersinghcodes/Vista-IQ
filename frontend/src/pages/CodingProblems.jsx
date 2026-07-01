import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, CheckCircle2, Clock3, Search, Star } from 'lucide-react';
import { authFetch } from '../api';
import Navbar from '../components/Navbar';

const TOPICS = [
  { key: 'all', label: 'All Topics', match: [] },
  { key: 'arrays', label: 'Arrays', match: ['arrays', 'array'] },
  { key: 'strings', label: 'Strings', match: ['strings', 'string'] },
  { key: 'hash-map', label: 'HashMap', match: ['hash-map'] },
  { key: 'stack', label: 'Stack', match: ['stack'] },
  { key: 'queue', label: 'Queue', match: ['queue'] },
  { key: 'linked-list', label: 'Linked List', match: ['linked_lists', 'linked-list'] },
  { key: 'trees', label: 'Trees', match: ['trees', 'tree'] },
  { key: 'graphs', label: 'Graphs', match: ['graphs', 'graph'] },
  { key: 'heap', label: 'Heap', match: ['heap'] },
  { key: 'greedy', label: 'Greedy', match: ['greedy'] },
  { key: 'binary-search', label: 'Binary Search', match: ['binary_search', 'binary-search'] },
  { key: 'sliding-window', label: 'Sliding Window', match: ['sliding-window'] },
  { key: 'backtracking', label: 'Backtracking', match: ['backtracking'] },
  { key: 'recursion', label: 'Recursion', match: ['recursion'] },
  { key: 'dynamic-programming', label: 'Dynamic Programming', match: ['dynamic_programming', 'dynamic-programming'] },
  { key: 'trie', label: 'Trie', match: ['trie'] },
  { key: 'union-find', label: 'Union Find', match: ['union_find', 'union-find'] },
  { key: 'bit-manipulation', label: 'Bit Manipulation', match: ['bit_manipulation', 'bit-manipulation'] },
  { key: 'sql', label: 'SQL', match: ['sql'] },
  { key: 'design', label: 'Design', match: ['design'] },
];

const ROLE_TOPIC_HINTS = {
  Frontend: ['strings', 'arrays', 'hash-map', 'design'],
  Backend: ['arrays', 'graphs', 'design', 'sql', 'heap'],
  'Full Stack': ['arrays', 'strings', 'design', 'sql'],
  'Data Analyst': ['sql', 'arrays', 'hash-map'],
  'Data Scientist': ['arrays', 'dynamic-programming', 'sql', 'heap'],
  'AI Engineer': ['arrays', 'graphs', 'dynamic-programming', 'heap'],
  DevOps: ['graphs', 'sql', 'design'],
  Cloud: ['graphs', 'design', 'queue'],
  QA: ['strings', 'arrays', 'hash-map'],
  'Cyber Security': ['graphs', 'strings', 'bit-manipulation'],
  'Product Manager': ['sql', 'design', 'arrays'],
};

const DIFF_CLASS = {
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const MAX_FILTER_TEXT = 120;
const readJson = async (res, fallback) => {
  if (!res.ok) return fallback;
  try {
    return await res.json();
  } catch {
    return fallback;
  }
};
const normalizeDiff = value => String(value || 'all').toLowerCase();
const clean = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_FILTER_TEXT);

function topicMatches(problem, topicKey) {
  if (topicKey === 'all') return true;
  const topic = TOPICS.find(t => t.key === topicKey);
  if (!topic) return true;
  const haystack = [problem.category, ...(problem.tags || [])].map(t => String(t).toLowerCase());
  return topic.match.some(match => haystack.includes(match));
}

function roleMatches(problem, role) {
  if (!role) return true;
  const hints = ROLE_TOPIC_HINTS[role] || ROLE_TOPIC_HINTS[Object.keys(ROLE_TOPIC_HINTS).find(key => role.toLowerCase().includes(key.toLowerCase()))];
  if (!hints) return true;
  return hints.some(topic => topicMatches(problem, topic));
}

export default function CodingProblems() {
  const [searchParams] = useSearchParams();
  const requestedCompany = clean(searchParams.get('company'));
  const requestedRole = clean(searchParams.get('role'));
  const requestedDifficulty = normalizeDiff(searchParams.get('difficulty'));
  const initialDifficulty = ['easy', 'medium', 'hard'].includes(requestedDifficulty) ? requestedDifficulty : 'all';

  const [problems, setProblems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [companyPaths, setCompanyPaths] = useState({});
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState(initialDifficulty);
  const [topic, setTopic] = useState('all');
  const [company, setCompany] = useState(requestedCompany || 'all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('problems');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [bookmarkingId, setBookmarkingId] = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch('/coding/problems').then(r => readJson(r, [])),
      authFetch('/coding/analytics').then(r => readJson(r, null)),
      authFetch('/coding/roadmap').then(r => readJson(r, [])),
      authFetch('/coding/company-paths').then(r => readJson(r, {})),
    ]).then(([p, a, r, c]) => {
      setProblems(Array.isArray(p) ? p : []);
      setAnalytics(a);
      setRoadmap(Array.isArray(r) ? r : []);
      setCompanyPaths(c && typeof c === 'object' ? c : {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCompany(requestedCompany || 'all');
    setDiff(initialDifficulty);
    setExpandedId(null);
    setDetail(null);
  }, [requestedCompany, initialDifficulty]);

  const companies = useMemo(() => {
    const names = new Set(['all']);
    if (requestedCompany) names.add(requestedCompany);
    problems.forEach(p => (p.companies || []).forEach(name => names.add(name)));
    return [...names];
  }, [problems, requestedCompany]);

  const hasExactCompanyProblems = company === 'all' || problems.some(p => (p.companies || []).includes(company));
  const filtered = problems
    .filter(p => diff === 'all' || p.difficulty === diff)
    .filter(p => topicMatches(p, topic))
    .filter(p => company === 'all' || !hasExactCompanyProblems || (p.companies || []).includes(company))
    .filter(p => hasExactCompanyProblems || roleMatches(p, requestedRole))
    .filter(p => {
      const query = search.toLowerCase();
      if (!query) return true;
      return p.title.toLowerCase().includes(query) || (p.tags || []).some(t => t.toLowerCase().includes(query));
    });

  const toggleBookmark = async (id) => {
    if (bookmarkingId === id) return;
    setBookmarkingId(id);
    try {
      const res = await authFetch('/coding/bookmark', { method: 'POST', body: JSON.stringify({ problem_id: id }) });
      if (!res.ok) return;
      const data = await readJson(res, {});
      if (typeof data.bookmarked === 'boolean') {
        setProblems(prev => prev.map(p => p.id === id ? { ...p, bookmarked: data.bookmarked } : p));
      }
    } finally {
      setBookmarkingId(null);
    }
  };

  const loadDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    const res = await authFetch(`/coding/problems/${id}`);
    if (!res.ok) return;
    setDetail(await readJson(res, null));
    setExpandedId(id);
  };

  const tabs = [
    { key: 'problems', label: 'Problems' },
    { key: 'roadmap', label: 'DSA Roadmap' },
    { key: 'companies', label: 'Company Coding Paths' },
    { key: 'bookmarks', label: 'Bookmarks' },
  ];

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Coding <span className="text-gradient">Prep</span></h1>
            <p className="text-gray-500 text-sm">Master coding patterns with curated practice problems and direct practice links</p>
          </div>
          {tab === 'problems' && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input placeholder="Search problems..." value={search} onChange={e => setSearch(e.target.value.slice(0, MAX_FILTER_TEXT))} maxLength={MAX_FILTER_TEXT} aria-label="Search coding problems" className="w-full sm:w-72 pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-[var(--color-accent)] transition-colors placeholder-gray-600"/>
            </div>
          )}
        </div>

        {(requestedCompany || requestedRole || initialDifficulty !== 'all') && (
          <div className="glass-card p-4 mb-5 flex flex-wrap items-center gap-2 text-xs text-gray-300 animate-slide-up">
            {requestedCompany && <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{requestedCompany}</span>}
            {requestedRole && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">{requestedRole}</span>}
            {initialDifficulty !== 'all' && <span className={`px-3 py-1 rounded-full border capitalize ${DIFF_CLASS[initialDifficulty]}`}>{initialDifficulty}</span>}
            {!hasExactCompanyProblems && requestedCompany && <span className="text-gray-500">Showing role and difficulty matched coding practice for this company context.</span>}
          </div>
        )}

        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <StatCard label="Total" value={analytics.total_problems}/>
            <StatCard label="Solved" value={analytics.problems_solved} color="text-emerald-400"/>
            <StatCard label="Easy" value={`${analytics.easy?.solved || 0}/${analytics.easy?.total || 0}`}/>
            <StatCard label="Medium" value={`${analytics.medium?.solved || 0}/${analytics.medium?.total || 0}`}/>
            <StatCard label="Hard" value={`${analytics.hard?.solved || 0}/${analytics.hard?.total || 0}`}/>
          </div>
        )}

        <div className="flex gap-1.5 mb-5 flex-wrap animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'problems' && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {['all', 'easy', 'medium', 'hard'].map(d => (
                <button key={d} onClick={() => setDiff(d)} aria-pressed={diff === d} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${diff === d ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-white' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>{d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {TOPICS.map(t => (
                <button key={t.key} onClick={() => setTopic(t.key)} aria-pressed={topic === t.key} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${topic === t.key ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-white' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>{t.label}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {companies.map(c => (
                <button key={c} onClick={() => setCompany(c)} aria-pressed={company === c} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${company === c ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>{c === 'all' ? 'All Companies' : c}</button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-gray-500"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin"/><span className="text-sm">Loading...</span></div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p, i) => (
                  <ProblemRow key={p.id} problem={p} index={i} expanded={expandedId === p.id} detail={detail} onExpand={loadDetail} onBookmark={toggleBookmark} bookmarking={bookmarkingId === p.id} />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-sm">No coding problems match these filters.</p>
                    <button onClick={() => { setDiff('all'); setTopic('all'); setCompany('all'); setSearch(''); }} className="mt-3 text-xs text-violet-400 hover:underline">Clear filters</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'roadmap' && (
          <div className="space-y-3">
            {roadmap.map((week, i) => (
              <div key={week.week || i} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${0.05 * i}s` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">W{week.week}</div>
                  <div><h3 className="font-bold text-sm">{week.title}</h3><div className="flex gap-1.5 mt-1 flex-wrap">{(week.topics || []).map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{t}</span>)}</div></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(week.problems || []).map(pid => {
                    const p = problems.find(x => x.id === pid);
                    return p ? <span key={pid} className={`text-[10px] px-2 py-0.5 rounded border ${DIFF_CLASS[p.difficulty]}`}>{p.title}</span> : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'companies' && (
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(companyPaths).map(([name, path], i) => (
              <div key={name} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${0.05 * i}s` }}>
                <h3 className="font-bold text-lg mb-1">{name}</h3>
                <p className="text-xs text-gray-400 mb-3">{path.tips}</p>
                <div className="mb-3"><h4 className="text-xs font-bold text-violet-400 mb-1">Focus Areas</h4><div className="flex flex-wrap gap-1.5">{(path.focus || []).map(f => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">{f}</span>)}</div></div>
                <h4 className="text-xs font-bold text-gray-400 mb-1">Recommended Problems</h4>
                <div className="flex flex-wrap gap-1.5">{(path.problems || []).map(pid => { const p = problems.find(x => x.id === pid); return p ? <span key={pid} className={`text-[10px] px-2 py-0.5 rounded border ${DIFF_CLASS[p.difficulty]}`}>{p.title}</span> : null; })}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'bookmarks' && (
          <div className="space-y-3">
            {problems.filter(p => p.bookmarked).length === 0 ? (
              <div className="glass-card p-10 text-center"><Star size={28} className="mx-auto mb-3 text-gray-500" /><p className="text-gray-500">No bookmarked problems yet. Star problems to save them here.</p></div>
            ) : problems.filter(p => p.bookmarked).map((p, i) => (
              <ProblemRow key={p.id} problem={p} index={i} expanded={expandedId === p.id} detail={detail} onExpand={loadDetail} onBookmark={toggleBookmark} bookmarking={bookmarkingId === p.id} compact />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ProblemRow({ problem: p, index, expanded, detail, onExpand, onBookmark, bookmarking = false, compact = false }) {
  return (
    <div className="animate-slide-up" style={{ animationDelay: `${0.03 * index}s` }}>
      <div className={`glass-card p-4 transition-all duration-300 hover:border-purple-500/20 ${expanded ? 'border-violet-500/30' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs text-gray-600 font-mono w-8 shrink-0">#{p.id}</span>
            <button onClick={() => onExpand(p.id)} aria-expanded={expanded} className="text-left min-w-0">
              <span className="font-bold text-sm hover:text-white transition-colors">{p.title}</span>
              {p.solved && <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 size={11} /> Solved</span>}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap md:justify-end">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${DIFF_CLASS[p.difficulty] || ''}`}>{p.difficulty}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 inline-flex items-center gap-1"><Clock3 size={10} /> {p.estimated_time || '30 min'}</span>
            {(p.companies || []).slice(0, compact ? 2 : 3).map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/15">{c}</span>)}
            <button aria-label={p.bookmarked ? 'Remove bookmark' : 'Bookmark problem'} disabled={bookmarking} onClick={() => onBookmark(p.id)} className="w-8 h-8 rounded-full hover:bg-white/5 inline-flex items-center justify-center text-violet-300 transition-colors disabled:opacity-50">
              {p.bookmarked ? <Star size={16} fill="currentColor" /> : <Bookmark size={16} />}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 md:ml-11">
          {(p.tags || []).map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-gray-500">{t}</span>)}
        </div>
        {p.links && (
          <div className="flex gap-2 mt-2 md:ml-11 flex-wrap">
            {p.links.leetcode && <a href={p.links.leetcode} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 hover:bg-amber-500/20 transition-all">LeetCode</a>}
            {p.links.gfg && <a href={p.links.gfg} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 transition-all">GFG</a>}
            {p.links.hackerrank && <a href={p.links.hackerrank} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15 hover:bg-blue-500/20 transition-all">HackerRank</a>}
          </div>
        )}
      </div>

      {expanded && detail && (
        <div className="glass-card p-5 mt-1 border-violet-500/20 animate-slide-up">
          <p className="text-sm text-gray-300 mb-3 whitespace-pre-line">{detail.description}</p>
          {(detail.examples || []).map((ex, i) => (
            <div key={i} className="p-3 rounded-lg bg-white/3 border border-white/5 mb-2 text-xs">
              <div><strong className="text-gray-400">Input:</strong> <code className="text-violet-300">{ex.input}</code></div>
              <div><strong className="text-gray-400">Output:</strong> <code className="text-emerald-300">{ex.output}</code></div>
              {ex.explanation && <div className="text-gray-500 mt-1">{ex.explanation}</div>}
            </div>
          ))}
          {detail.approach && (
            <div className="mt-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
              <h4 className="text-xs font-bold text-violet-400 mb-1">Approach</h4>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">{detail.approach}</pre>
              <div className="flex gap-3 mt-2 text-[10px] flex-wrap"><span className="text-emerald-400">{detail.time_complexity}</span><span className="text-blue-400">{detail.space_complexity}</span><span className="text-gray-400">{detail.estimated_time}</span></div>
            </div>
          )}
          {detail.hints && (
            <div className="mt-3">
              <h4 className="text-xs font-bold text-amber-400 mb-1">Hints</h4>
              {detail.hints.map((h, i) => <details key={i} className="text-xs text-gray-400 mb-1"><summary className="cursor-pointer hover:text-gray-300">Hint {i + 1}</summary><p className="pl-4 pt-1">{h}</p></details>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = '' }) {
  return (
    <div className="glass-card px-4 py-3">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

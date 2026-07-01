import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authFetch } from '../api';
import { useProfile } from '../context/ProfileContext';

const DEFAULT_ROUNDS = ['Technical', 'HR'];
const ROLE_OPTIONS = [
  'Software Engineer', 'Frontend', 'Backend', 'Full Stack', 'Data Analyst',
  'Data Scientist', 'AI Engineer', 'DevOps', 'Cloud', 'QA', 'Cyber Security',
  'Product Manager', 'Custom Role'
];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const DEFAULT_ROLES = ['Software Engineer'];
const CACHE_KEY = 'vista-iq-generated-company-prep';
const PREF_KEY = 'vista-iq-company-prep-preferences';
const CACHE_VERSION = 2;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_COMPANY_LENGTH = 120;
const MAX_ROLE_LENGTH = 80;
const PREP_SECTIONS = [
  ['overview', 'Company Overview'],
  ['hiring_process', 'Hiring Process'],
  ['oa_pattern', 'OA Pattern'],
  ['interview_rounds', 'Interview Rounds'],
  ['hr_questions', 'HR Questions'],
  ['technical_questions', 'Technical Questions'],
  ['behavioral_questions', 'Behavioral Questions'],
  ['system_design', 'System Design'],
  ['faqs', 'Frequently Asked Questions'],
  ['interview_tips', 'Interview Tips'],
  ['required_skills', 'Required Skills'],
];

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeDifficulty(value) {
  const normalized = String(value || '').trim();
  if (DIFFICULTY_OPTIONS.includes(normalized)) return normalized;
  if (/beginner|easy/i.test(normalized)) return 'Easy';
  if (/hard|advanced/i.test(normalized)) return 'Hard';
  return 'Medium';
}

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeCompany(company, index = 0) {
  const name = cleanText(company?.name, MAX_COMPANY_LENGTH) || `Company ${index + 1}`;
  const roles = Array.isArray(company?.roles) && company.roles.length ? company.roles.map(r => cleanText(r, MAX_ROLE_LENGTH)).filter(Boolean) : DEFAULT_ROLES;
  const rounds = Array.isArray(company?.rounds) && company.rounds.length ? company.rounds.filter(Boolean) : DEFAULT_ROUNDS;

  return {
    ...company,
    name,
    logo: isValidImageUrl(company?.logo) ? company.logo : '',
    roles,
    rounds,
    difficulty: normalizeDifficulty(company?.difficulty),
    hiring_status: company?.hiring_status || company?.hiringStatus || 'Hiring',
    job_count: Number.isFinite(Number(company?.job_count ?? company?.jobCount)) ? Number(company?.job_count ?? company?.jobCount) : 0,
    info: company?.info || company?.description || '',
    links: company?.links && typeof company.links === 'object' ? company.links : {},
    prep: company?.prep && typeof company.prep === 'object' ? company.prep : null,
    generated: Boolean(company?.generated),
  };
}

function CompanyLogo({ company, sizeClass = 'w-full h-full' }) {
  const [failed, setFailed] = useState(false);
  const initial = company?.name?.trim?.()?.charAt(0)?.toUpperCase() || '?';
  const showImage = company?.logo && !failed;

  if (showImage) {
    return (
      <img
        src={company.logo}
        alt={`${company.name} logo`}
        className={`${sizeClass} object-contain`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 font-extrabold`}>
      {initial}
    </div>
  );
}

function readCachedCompanies() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (!raw || raw.version !== CACHE_VERSION || Date.now() - Number(raw.savedAt || 0) > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return [];
    }
    return Array.isArray(raw.items) ? raw.items.map(normalizeCompany) : [];
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return [];
  }
}

function writeCachedCompanies(items) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    version: CACHE_VERSION,
    savedAt: Date.now(),
    items: items.slice(0, 20),
  }));
}

function readPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    return {
      role: cleanText(prefs.role, MAX_ROLE_LENGTH) || 'Software Engineer',
      customRole: cleanText(prefs.customRole, MAX_ROLE_LENGTH),
      difficulty: normalizeDifficulty(prefs.difficulty),
    };
  } catch {
    return { role: 'Software Engineer', customRole: '', difficulty: 'Medium' };
  }
}

export default function CompanySelection() {
  const { profile } = useProfile();
  const profileRole = profile?.title || profile?.role || '';
  const initialPrefs = useMemo(readPrefs, []);
  const [companies, setCompanies] = useState([]);
  const [generatedCompanies, setGeneratedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [role, setRole] = useState(initialPrefs.role);
  const [customRole, setCustomRole] = useState(initialPrefs.customRole);
  const [difficulty, setDifficulty] = useState(initialPrefs.difficulty);
  const [roundType, setRoundType] = useState('Technical');
  const nav = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await authFetch('/ai-interview/companies');
        if (res.ok) {
          const data = await res.json();
          setCompanies(Array.isArray(data) ? data.map(normalizeCompany) : []);
        }
      } catch {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    setGeneratedCompanies(readCachedCompanies());
  }, []);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ role, customRole, difficulty }));
  }, [role, customRole, difficulty]);

  const allCompanies = useMemo(() => [
    ...companies,
    ...generatedCompanies.filter(g => !companies.some(c => c.name.toLowerCase() === g.name.toLowerCase())),
  ], [companies, generatedCompanies]);
  const trimmedSearch = cleanText(search, MAX_COMPANY_LENGTH);
  const filtered = allCompanies.filter(c => c.name.toLowerCase().includes(trimmedSearch.toLowerCase()));
  const exactCompany = allCompanies.find(c => c.name.toLowerCase() === trimmedSearch.toLowerCase());
  const canGenerate = trimmedSearch.length > 1 && !exactCompany;

  const resolveRole = () => role === 'Custom Role' ? (cleanText(customRole, MAX_ROLE_LENGTH) || 'Software Engineer') : cleanText(role, MAX_ROLE_LENGTH);

  const selectCompany = (company) => {
    const normalized = normalizeCompany(company, allCompanies.length);
    const currentRole = resolveRole();
    const preferredRole = normalized.roles.includes(currentRole)
      ? currentRole
      : normalized.roles.includes(profileRole)
        ? profileRole
        : normalized.roles[0];
    const nextRole = ROLE_OPTIONS.includes(preferredRole) ? preferredRole : 'Custom Role';
    setSelectedCompany(normalized);
    setRole(nextRole);
    setCustomRole(nextRole === 'Custom Role' ? preferredRole : '');
    setDifficulty(difficulty || normalized.difficulty);
    setRoundType(normalized.rounds[0] || 'Technical');
  };

  const generateCompany = async () => {
    if (!canGenerate || generating) return;
    setGenerating(true);
    try {
      const res = await authFetch('/ai-interview/company-prep', {
        method: 'POST',
        body: JSON.stringify({ company: trimmedSearch, role: resolveRole(), difficulty }),
      });
      if (!res.ok) throw new Error('Unable to generate company prep.');
      const generated = normalizeCompany(await res.json(), allCompanies.length);
      const nextGenerated = [generated, ...generatedCompanies.filter(c => c.name.toLowerCase() !== generated.name.toLowerCase())];
      setGeneratedCompanies(nextGenerated);
      writeCachedCompanies(nextGenerated);
      selectCompany(generated);
    } catch {
      selectCompany({ name: trimmedSearch, roles: [resolveRole()], rounds: DEFAULT_ROUNDS, difficulty, generated: true });
    } finally {
      setGenerating(false);
    }
  };

  const startInterview = () => {
    if (!selectedCompany || !role || !roundType) return;
    const label = roundType.toLowerCase();
    const rType = label === 'hr' ? 'hr' : label === 'technical' || label === 'system design' || label === 'aptitude' ? 'technical' : 'behavioral';
    nav(`/ai-interview/${rType}?company=${encodeURIComponent(selectedCompany.name)}&role=${encodeURIComponent(resolveRole())}&difficulty=${encodeURIComponent(difficulty)}`);
  };

  const deleteGeneratedCompany = (companyName) => {
    const nextGenerated = generatedCompanies.filter(
      (c) => c.name.toLowerCase() !== companyName.toLowerCase()
    );

    setGeneratedCompanies(nextGenerated);
    writeCachedCompanies(nextGenerated);

    if (selectedCompany?.name?.toLowerCase() === companyName.toLowerCase()) {
      setSelectedCompany(null);
    }
  };

  const practiceCoding = () => {
    if (!selectedCompany) return;
    const params = new URLSearchParams({ company: selectedCompany.name, role: resolveRole(), difficulty });
    nav(`/coding?${params.toString()}`);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

        <div className="animate-slide-up mb-8">
          <h1 className="text-4xl font-extrabold mb-3">Company <span className="text-gradient">Specific</span> Prep</h1>
          <p className="text-gray-400 text-lg">Simulate real interviews tailored to top tech companies.</p>
        </div>

        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search any company (e.g., Google, Amazon, OpenAI)"
              value={search}
              onChange={e => setSearch(e.target.value.slice(0, MAX_COMPANY_LENGTH))}
              maxLength={MAX_COMPANY_LENGTH}
              aria-label="Search company"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-gray-200 outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {filtered.map(company => (
              <div
                key={company.name}
                onClick={() => selectCompany(company)}
                className={`relative glass-card p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${selectedCompany?.name === company.name ? 'ring-2 ring-[var(--color-accent)] bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-4 mb-4">

                  {company.generated && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${company.name}"?`)) {
                          deleteGeneratedCompany(company.name);
                        }
                      }}
                      className="absolute top-2 right-2 rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                      title="Delete generated company"
                    >
                      🗑
                    </button>
                  )}

                  <div className="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center shrink-0">
                    <CompanyLogo company={company} />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">{company.name}</h3>
                    <div className="text-xs text-gray-400 px-2 py-0.5 bg-white/5 rounded-full inline-block mt-1">
                      {company.difficulty}
                    </div>
                  </div>

                </div>
                <div className="text-xs text-gray-500 mb-2 font-semibold">ROLES:</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {company.roles.slice(0, 3).map(r => <span key={r} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300">{r}</span>)}
                  {company.roles.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">+{company.roles.length - 3}</span>}
                </div>
              </div>
            ))}
            {canGenerate && (
              <div className="glass-card p-5 text-sm text-gray-400">
                <div className="font-bold text-white mb-1">Prepare for {trimmedSearch}</div>
                <p className="mb-4">{filtered.length ? 'Not the company you meant?' : 'Generate company preparation with AI and cache it for next time.'}</p>
                <button onClick={generateCompany} disabled={generating} className="btn-gradient px-4 py-2 rounded-lg font-bold disabled:opacity-60">
                  {generating ? 'Generating...' : 'Generate Prep'}
                </button>
              </div>
            )}
          </div>
        )}

        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="presentation">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-slide-up border border-[var(--color-accent)]/30 shadow-2xl shadow-purple-500/20" role="dialog" aria-modal="true" aria-labelledby="company-prep-title">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg p-1">
                    <CompanyLogo company={selectedCompany} />
                  </div>
                  <h2 id="company-prep-title" className="text-xl font-bold">{selectedCompany.name} Interview</h2>
                </div>
                <button onClick={() => setSelectedCompany(null)} className="text-gray-400 hover:text-white" aria-label="Close company prep dialog">x</button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Target Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-[var(--color-accent)]">
                      {[...new Set([...selectedCompany.roles, ...ROLE_OPTIONS])].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Difficulty</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-[var(--color-accent)]">
                      {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                {role === 'Custom Role' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Custom Role</label>
                    <input value={customRole} onChange={e => setCustomRole(e.target.value.slice(0, MAX_ROLE_LENGTH))} maxLength={MAX_ROLE_LENGTH} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-[var(--color-accent)]" placeholder="Enter target role" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Interview Round</label>
                  <select value={roundType} onChange={e => setRoundType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-[var(--color-accent)]">
                    {selectedCompany.rounds.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {selectedCompany.prep && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PREP_SECTIONS.map(([key, label]) => {
                      const value = selectedCompany.prep[key];
                      const items = Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
                      if (!items.length) return null;
                      return (
                        <div key={key} className="rounded-lg bg-white/5 border border-white/10 p-3">
                          <div className="text-xs font-bold text-violet-300 mb-1">{label}</div>
                          {key === 'overview' ? (
                            <p className="text-xs text-gray-300 leading-relaxed">{items[0]}</p>
                          ) : (
                            <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                              {items.slice(0, 5).map(item => <li key={item}>{item}</li>)}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setSelectedCompany(null)} className="flex-1 py-3 rounded-lg border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={practiceCoding} className="flex-1 py-3 rounded-lg border border-violet-500/30 text-violet-300 font-semibold hover:bg-violet-500/10 transition-colors">Practice Coding</button>
                <button onClick={startInterview} className="flex-1 btn-gradient py-3 rounded-lg font-bold">Start Now</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authFetch } from '../api';
import { useProfile } from '../context/ProfileContext';

export default function CompanySelection() {
  const { profile } = useProfile();
  const profileRole = profile?.title || profile?.role || '';
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [role, setRole] = useState('');
  const [roundType, setRoundType] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await authFetch('/ai-interview/companies');
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const startInterview = () => {
    if (!selectedCompany || !role || !roundType) return;
    const rType = roundType.toLowerCase() === 'hr' ? 'hr' : roundType.toLowerCase() === 'system design' ? 'technical' : roundType.toLowerCase() === 'technical' ? 'technical' : 'behavioral';
    nav(`/ai-interview/${rType}?company=${encodeURIComponent(selectedCompany.name)}&role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(selectedCompany.difficulty)}`);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

        <div className="animate-slide-up mb-8">
          <h1 className="text-4xl font-extrabold mb-3">Company <span className="text-gradient">Specific</span> Prep</h1>
          <p className="text-gray-400 text-lg">Simulate real interviews tailored to top tech companies.</p>
        </div>

        {/* Search */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search companies (e.g., Google, Amazon)..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-gray-200 outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin"/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {filtered.map(company => (
              <div 
                key={company.name}
                onClick={() => {
                  setSelectedCompany(company);
                  setRole(company.roles.includes(profileRole) ? profileRole : company.roles[0]);
                  setRoundType(company.rounds[0]);
                }}
                className={`glass-card p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${selectedCompany?.name === company.name ? 'ring-2 ring-[var(--color-accent)] bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center shrink-0">
                    <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{company.name}</h3>
                    <div className="text-xs text-gray-400 px-2 py-0.5 bg-white/5 rounded-full inline-block mt-1">{company.difficulty}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-2 font-semibold">ROLES:</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {company.roles.slice(0,3).map(r => <span key={r} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300">{r}</span>)}
                  {company.roles.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">+{company.roles.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Configuration Modal / Wizard */}
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-md p-6 animate-slide-up border border-[var(--color-accent)]/30 shadow-2xl shadow-purple-500/20">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg p-1">
                    <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-xl font-bold">{selectedCompany.name} Interview</h2>
                </div>
                <button onClick={() => setSelectedCompany(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Target Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-[var(--color-accent)]">
                    {selectedCompany.roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Interview Round</label>
                  <select value={roundType} onChange={e => setRoundType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-[var(--color-accent)]">
                    {selectedCompany.rounds.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedCompany(null)} className="flex-1 py-3 rounded-lg border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={startInterview} className="flex-1 btn-gradient py-3 rounded-lg font-bold">Start Now 🚀</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

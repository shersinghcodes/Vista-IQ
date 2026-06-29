import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ROUNDS = [
  { key: 'hr', icon: '🤝', title: 'HR Interview', desc: 'Communication, culture fit, career goals', color: 'from-violet-600 to-purple-600' },
  { key: 'technical', icon: '⚙️', title: 'Technical Interview', desc: 'DSA, system design, programming concepts', color: 'from-blue-600 to-cyan-600' },
  { key: 'behavioral', icon: '🧠', title: 'Behavioral Interview', desc: 'Leadership, teamwork, problem-solving (STAR)', color: 'from-pink-600 to-rose-600' },
];

export default function InterviewLobby() {
  const [selected, setSelected] = useState(null);
  const [numQ, setNumQ] = useState(5);
  const nav = useNavigate();

  const start = () => {
    if (!selected) return;
    nav(`/ai-interview/${selected}?questions=${numQ}`);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>

        <div className="animate-slide-up">
          <h1 className="text-3xl font-extrabold mb-2">AI <span className="text-gradient">Interview</span></h1>
          <p className="text-gray-500 mb-8">Choose your interview type and start practicing with our AI interviewer.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {ROUNDS.map((r, i) => (
            <button
              key={r.key}
              onClick={() => setSelected(r.key)}
              className={`glass-card p-6 text-left transition-all duration-300 cursor-pointer animate-slide-up
                ${selected === r.key ? 'ring-2 ring-[var(--color-accent)] shadow-lg shadow-purple-500/10' : 'hover:border-gray-600'}
              `}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-2xl mb-4`}>{r.icon}</div>
              <h3 className="font-bold text-lg mb-1">{r.title}</h3>
              <p className="text-sm text-gray-400">{r.desc}</p>
              {selected === r.key && <div className="mt-3 text-xs text-[var(--color-accent-light)] font-semibold">✓ Selected</div>}
            </button>
          ))}
        </div>

        <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">🔢 Number of Questions</h3>
            <span className="text-2xl font-bold text-[var(--color-accent-light)]">{numQ}</span>
          </div>
          <input type="range" min={3} max={10} value={numQ} onChange={e => setNumQ(+e.target.value)}
            className="w-full accent-[var(--color-accent)] h-2 rounded-full appearance-none bg-gray-800" />
          <div className="flex justify-between text-xs text-gray-500 mt-1"><span>3</span><span>10</span></div>
        </div>

        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎙️</span>
            <div>
              <h3 className="font-semibold">Voice Features</h3>
              <p className="text-sm text-gray-400">AI speaks questions aloud • Use microphone to answer</p>
            </div>
          </div>
          <button
            onClick={start}
            disabled={!selected}
            className="btn-gradient w-full py-3 px-6 rounded-xl font-bold text-lg disabled:opacity-40"
          >
            {selected ? `🚀 Start ${ROUNDS.find(r=>r.key===selected)?.title}` : 'Select an interview type above'}
          </button>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Line, Radar, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Link } from 'react-router-dom';
import { authFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import Navbar from '../components/Navbar';
import {
  Mic, Building2, Code2, FileText, Map, TrendingUp,
  Award, Target, Clock, Zap, ChevronRight,
} from 'lucide-react';
import { Briefcase } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend);

const CHART_OPTS = {
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } } },
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } } },
  },
  maintainAspectRatio: false,
};
const COLORS = ['#6c63ff', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const QUICK_ACTIONS = [
  { to: '/ai-interview', icon: Mic, label: 'AI Interview', desc: 'Practice with voice AI', color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
  { to: '/company-prep', icon: Building2, label: 'Company Prep', desc: 'Mock FAANG interviews', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { to: '/coding', icon: Code2, label: 'Coding', desc: 'Solve LeetCode problems', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { to: '/resume', icon: FileText, label: 'Resume AI', desc: 'Analyse & score', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { to: '/roadmap', icon: Map, label: 'Roadmap', desc: 'Personalised study plan', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { to: '/job-market', icon: Briefcase, label: 'Job Market', desc: 'Live jobs & salary insights', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [data, setData] = useState(null);
  const [aiStats, setAiStats] = useState(null);

  useEffect(() => {
    authFetch('/interview/analytics').then(r => r.json()).then(setData).catch(() => { });
    authFetch('/ai-interview/analytics').then(r => r.json()).then(setAiStats).catch(() => { });
  }, []);

  const firstName = (
    user?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User"
  ).split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <Navbar />
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 10 }}>

        {/* ── Header ── */}
        <div className="animate-slide-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>{greeting} 👋</p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {firstName}<span className="text-gradient">'s Dashboard</span>
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Your AI interview performance at a glance
            </p>
          </div>
          <Link to="/ai-interview" className="btn-gradient" style={{
            padding: '11px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '7px',
          }}>
            <Zap size={14} fill="white" /> Start Interview
          </Link>
        </div>

        {/* ── AI Stats Row ── */}
        {aiStats && (
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px', marginBottom: '20px', animationDelay: '0.05s' }}>
            <StatCard icon={<Award size={18} />} label="AI Sessions" value={aiStats.total_sessions} color="#6c63ff" delay={0} />
            <StatCard icon={<Target size={18} />} label="Avg Score" value={aiStats.avg_score?.toFixed?.(1) ?? aiStats.avg_score} color="#a855f7" delay={0.05} />
            <StatCard icon={<TrendingUp size={18} />} label="HR Avg" value={aiStats.by_round_type?.hr?.avg || '—'} color="#ec4899" delay={0.1} />
            <StatCard icon={<Mic size={18} />} label="Technical Avg" value={aiStats.by_round_type?.technical?.avg || '—'} color="#3b82f6" delay={0.15} />
            <StatCard icon={<Clock size={18} />} label="Behavioral Avg" value={aiStats.by_round_type?.behavioral?.avg || '—'} color="#10b981" delay={0.2} />
          </div>
        )}

        {/* ── Quick Actions ── */}
        {/* <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px', marginBottom: '24px', animationDelay: '0.1s' }}>
          {QUICK_ACTIONS.map((a, i) => (
            <Link
              key={i} to={a.to}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.25s', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${a.color}40`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${a.color}18`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: a.bg, border: `1px solid ${a.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color,
                }}>
                  <a.icon size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{a.label}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.desc}</div>
                </div>
                <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div> */}

        {/* ── Charts Bento Grid ── */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '14px', marginBottom: '20px' }}>

            {/* Score Trend — spans 2 cols */}
            <div className="glass-card animate-slide-up" style={{ gridColumn: '1 / 3', padding: '20px', animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} style={{ color: '#6c63ff' }} /> Score Trend
                </h3>
              </div>
              <div style={{ height: '180px' }}>
                <Line
                  data={{
                    labels: data.charts.trend.labels,
                    datasets: [{
                      label: 'Score', data: data.charts.trend.scores,
                      borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.08)',
                      fill: true, tension: 0.4, pointBackgroundColor: '#6c63ff',
                      pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4,
                    }],
                  }}
                  options={CHART_OPTS}
                />
              </div>
            </div>

            {/* Radar — 1 col */}
            <div className="glass-card animate-slide-up" style={{ padding: '20px', animationDelay: '0.25s' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                🕸 Topic Proficiency
              </h3>
              <div style={{ height: '180px' }}>
                <Radar
                  data={{
                    labels: data.charts.radar.labels,
                    datasets: [{
                      label: 'Proficiency', data: data.charts.radar.scores,
                      borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.15)',
                      pointBackgroundColor: COLORS,
                    }],
                  }}
                  options={{
                    scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, color: 'rgba(255,255,255,0.25)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } } } },
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            {/* Doughnut */}
            <div className="glass-card animate-slide-up" style={{ padding: '20px', animationDelay: '0.3s' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                🍩 By Category
              </h3>
              <div style={{ height: '160px' }}>
                <Doughnut
                  data={{
                    labels: data.charts.doughnut.labels,
                    datasets: [{ data: data.charts.doughnut.counts, backgroundColor: COLORS, borderColor: '#08080f', borderWidth: 3 }],
                  }}
                  options={{ cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, boxWidth: 10 } } }, maintainAspectRatio: false }}
                />
              </div>
            </div>

            {/* Score Distribution */}
            <div className="glass-card animate-slide-up" style={{ padding: '20px', animationDelay: '0.35s' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                📊 Score Distribution
              </h3>
              <div style={{ height: '160px' }}>
                <Bar
                  data={{
                    labels: data.charts.distribution.labels,
                    datasets: [{
                      data: data.charts.distribution.counts,
                      backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)', 'rgba(108,99,255,0.7)'],
                      borderRadius: 6,
                    }],
                  }}
                  options={CHART_OPTS}
                />
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="glass-card animate-slide-up" style={{ padding: '20px', animationDelay: '0.4s' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                📅 Weekly Activity
              </h3>
              <div style={{ height: '160px' }}>
                <Bar
                  data={{
                    labels: data.charts.weekly.labels,
                    datasets: [{
                      data: data.charts.weekly.counts,
                      backgroundColor: 'rgba(108,99,255,0.55)', borderColor: '#6c63ff',
                      borderWidth: 1, borderRadius: 6,
                    }],
                  }}
                  options={CHART_OPTS}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Recent AI Sessions ── */}
        {aiStats?.recent_scores?.length > 0 && (
          <div className="glass-card animate-slide-up" style={{ padding: '20px', animationDelay: '0.45s' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} /> Recent AI Interview Sessions
            </h3>
            <div>
              {aiStats.recent_scores.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < aiStats.recent_scores.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {s.company && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.07)',
                      }}>{s.company}</span>
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.65)', textTransform: 'capitalize' }}>{s.type} Interview</span>
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                    background: s.score >= 70 ? 'rgba(16,185,129,0.15)' : s.score >= 45 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: s.score >= 70 ? '#6ee7b7' : s.score >= 45 ? '#fcd34d' : '#fca5a5',
                  }}>
                    {s.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!data && !aiStats && (
          <div className="glass-card animate-slide-up" style={{ padding: '60px', textAlign: 'center', animationDelay: '0.15s' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to start?</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '24px', fontSize: '14px' }}>
              Complete your first interview session to see your analytics here.
            </p>
            <Link to="/ai-interview" className="btn-gradient" style={{
              padding: '12px 28px', borderRadius: '10px', fontWeight: 700,
              fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>
              <Mic size={14} /> Start First Interview
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function StatCard({ icon, label, value, color, delay }) {
  return (
    <div
      className="glass-card animate-slide-up"
      style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
        animationDelay: `${delay}s`, transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.2 }}>{value ?? '—'}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

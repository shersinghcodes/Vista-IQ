import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import {
  LayoutDashboard, Mic, Building2, Code2, FileText,
  Brain, Activity, Map, Target, LogOut,
  ChevronRight, Zap, Briefcase, User
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/job-market', icon: Briefcase, label: 'Job Market' },
  { to: '/ai-interview', icon: Mic, label: 'AI Interview' },
  { to: '/company-prep', icon: Building2, label: 'Company Prep' },
  { to: '/coding', icon: Code2, label: 'Coding' },
  { to: '/resume', icon: FileText, label: 'Resume' },
  { to: "/resume-builder", icon: FileText, label: "Resume Builder" },
  // { to: '/emotion', icon: Brain, label: 'Emotion' },
  { to: '/confidence', icon: Activity, label: 'Speech' },
  { to: '/roadmap', icon: Map, label: 'Roadmap' },
  { to: '/job-matching', icon: Target, label: 'Job Match' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: "/profile", icon: User, label: "Profile" }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const loc = useLocation();
  const nav = useNavigate();

  const isActive = (path) => loc.pathname.startsWith(path);

  const handleLogout = () => { logout(); nav('/'); };

  const displayName = profile?.name || user?.name || user?.email || 'U';
  const initials = displayName[0].toUpperCase();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      height: '60px',
      background: 'rgba(8,8,15,0.85)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(24px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '8px',
    }}>
      {/* Logo */}
      <Link to="/job-market" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none', marginRight: '16px', flexShrink: 0,
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(108,99,255,0.35)',
        }}>
          <Zap size={16} color="white" fill="white" />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '14px', color: '#f1f1f5', letterSpacing: '-0.4px', display: 'block' }}>
            Vista IQ <span style={{ background: 'linear-gradient(90deg,#a855f7,#6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '2px', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '12.5px', fontWeight: 500,
                whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                background: active ? 'rgba(108,99,255,0.18)' : 'transparent',
                border: active ? '1px solid rgba(108,99,255,0.25)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={13} />
              {label}
              {active && <ChevronRight size={10} style={{ opacity: 0.6 }} />}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: profile?.photoURL ? `url(${profile.photoURL}) center / cover` : 'linear-gradient(135deg, #6c63ff, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#fff',
            boxShadow: '0 0 12px rgba(108,99,255,0.3)',
          }}>
            {!profile?.photoURL && initials}
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              color: 'rgba(239,68,68,0.7)', fontSize: '11.5px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = 'rgba(239,68,68,0.7)';
            }}
          >
            <LogOut size={11} /> Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

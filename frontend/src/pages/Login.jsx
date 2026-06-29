import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost, authFetch, API } from '../api';
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiPost('/auth/login', { email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const me = await (await authFetch('/users/me')).json();
      login(data.access_token, data.refresh_token, me);
      nav('/dashboard');
    } catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Left: branding panel */}
      <div style={{
        flex: '0 0 42%', display: 'none', flexDirection: 'column',
        justifyContent: 'center', padding: '60px',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.1) 0%, rgba(168,85,247,0.08) 50%, rgba(236,72,153,0.06) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
      }} className="login-left-panel">
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px rgba(108,99,255,0.4)',
          marginBottom: '32px',
        }}>
          <Zap size={28} color="white" fill="white" />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.2, marginBottom: '8px' }}>
          Vista IQ <span className="text-gradient">AI</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Smart Career Prep</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.7, maxWidth: '340px' }}>
          Practice with real AI interviewers, get instant feedback, and land your dream job faster.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '40px' }}>
          {[
            { icon: '🎤', text: 'AI-powered voice interviews' },
            { icon: '📊', text: 'Real-time performance analytics' },
            { icon: '🗺️', text: 'Personalized learning roadmaps' },
          ].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{feat.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{feat.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 10,
      }}>
        <div className="glass-card animate-slide-up" style={{
          width: '100%', maxWidth: '420px', padding: '44px 40px',
        }}>
          {/* Logo (mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(108,99,255,0.35)',
            }}>
              <Zap size={20} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Vista IQ</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Smart Career Prep</div>
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Welcome back</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
            Sign in to continue your journey
          </p>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoFocus
                  style={{
                    width: '100%', padding: '12px 14px 12px 38px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: '#f1f1f5', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 40px 12px 38px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: '#f1f1f5', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px',
                }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-gradient"
              style={{
                width: '100%', padding: '13px', borderRadius: '10px',
                fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading
                ? <><span className="loader-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%' }} /> Signing in…</>
                : 'Sign In →'
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <a href={`${API}/auth/google`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '12px', borderRadius: '10px', textDecoration: 'none',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#f1f1f5', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" width="16" />
            Continue with Google
          </a>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
              Create one →
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

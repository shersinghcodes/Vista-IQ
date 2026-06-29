import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost, authFetch, API } from '../api';
import { Mail, Lock, User, Zap, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong 💪'][strength];
  const strengthColor = ['transparent', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiPost('/auth/register', { email, password, name });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const me = await (await authFetch('/users/me')).json();
      login(data.access_token, data.refresh_token, me);
      nav('/dashboard');
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px 12px 38px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#f1f1f5', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '44px 40px', position: 'relative', zIndex: 10 }}>
        {/* Logo */}
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
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Vista-IQ</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Smart Career Prep</div>
          </div>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Create account</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
          Start your AI interview journey today
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" autoFocus
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                style={{ ...inputStyle, paddingRight: '40px' }}
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
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '3px', borderRadius: '2px',
                      background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                style={{ ...inputStyle, borderColor: confirm && confirm !== password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
                onBlur={e => e.target.style.borderColor = confirm && confirm !== password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-gradient"
            style={{
              width: '100%', padding: '13px', borderRadius: '10px',
              fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading
              ? <><span className="loader-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%' }} /> Creating account…</>
              : 'Create Account →'
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
          Already have an account?{' '}
          <Link to="/" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}

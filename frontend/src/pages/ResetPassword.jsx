import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiPost } from '../api';
import { Lock, Zap, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = searchParams.get('token');
    if (!token) { setError('Reset token is missing.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true); setError(''); setMessage('');
    try {
      const data = await apiPost('/auth/reset-password', { token, password });
      setMessage(data.message || 'Password updated successfully.');
      setPassword('');
      setConfirm('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '12px 40px 12px 38px',
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

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '44px 40px', position: 'relative', zIndex: 10 }}>
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

        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Reset password</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
          Enter a new password
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

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            color: '#86efac', fontSize: '13px',
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px',
              }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gradient" style={{
            width: '100%', padding: '13px', borderRadius: '10px',
            fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '24px' }}>
          <Link to="/" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

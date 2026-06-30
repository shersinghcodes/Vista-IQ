import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../api';
import { Mail, Zap } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const data = await apiPost('/auth/forgot-password', { email });
      setMessage(data.message || 'If an account exists, a password reset email has been sent.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
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

        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Forgot password</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
          Enter your email to receive a reset link
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
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '12px 14px 12px 38px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: '#f1f1f5', fontSize: '14px', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gradient" style={{
            width: '100%', padding: '13px', borderRadius: '10px',
            fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
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

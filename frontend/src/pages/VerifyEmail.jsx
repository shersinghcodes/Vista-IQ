import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import { MailCheck, Zap } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying email...');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Verification token is missing.');
      setMessage('');
      return;
    }

    fetch(`${API}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || 'Verification failed.');
        setMessage(data.message || 'Email verified successfully.');
      })
      .catch((err) => {
        setError(err.message);
        setMessage('');
      });
  }, [searchParams]);

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

        <MailCheck size={28} color="#a5b4fc" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Email verification</h2>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', margin: '20px 0',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            color: '#86efac', fontSize: '13px',
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', margin: '20px 0',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <Link to="/" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

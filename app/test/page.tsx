'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function TestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'account_connected') {
      setStatus('success');
      setMessage('✅ Google Calendar account connected successfully!');
      // Auto-redirect to settings after 3 seconds
      setTimeout(() => {
        router.push('/settings');
      }, 3000);
    } else if (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error}`);
    } else {
      setStatus('success');
      setMessage('🧪 OAuth Test Page');
    }
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '40px',
        borderRadius: '8px',
        backgroundColor: '#2a2a2a',
        border: '1px solid #444',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{
          color: status === 'success' ? '#2e7d32' : status === 'error' ? '#c62828' : '#4285f4',
          marginBottom: '20px'
        }}>
          {status === 'success' ? '🎉' : status === 'error' ? '⚠️' : '⏳'} OAuth Test
        </h1>

        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          {message}
        </p>

        {status === 'success' && searchParams.get('success') === 'account_connected' && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Redirecting to settings page in 3 seconds...
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go to Settings
          </button>

          <button
            onClick={() => router.push('/api/test-integration')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Dashboard
          </button>
        </div>

        {searchParams.get('success') === 'account_connected' && (
          <div style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#1c3c1c',
            border: '1px solid #2e7d32',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>What happens next:</strong>
            <ul style={{ textAlign: 'left', marginTop: '10px' }}>
              <li>Your Google Calendar account is now connected</li>
              <li>Go to Settings → Connected Calendars to manage accounts</li>
              <li>The Schedule widget will now show your real calendar events</li>
              <li>You can add additional accounts using the "Add account" button</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
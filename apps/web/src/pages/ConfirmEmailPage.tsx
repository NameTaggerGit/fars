import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing token');
      return;
    }
    authApi.confirmEmail(token).then(
      () => {
        setStatus('ok');
      },
      (err: { response?: { data?: { message?: string } } }) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Invalid or expired link');
      },
    );
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-soft-lg border border-white/20 dark:border-slate-700/50 p-8 text-center">
        {status === 'loading' && <p className="text-slate-600 dark:text-slate-300">Confirming your email...</p>}
        {status === 'ok' && (
          <>
            <p className="text-green-600 dark:text-green-400 font-medium">Email confirmed.</p>
            <Link to="/login" className="mt-4 inline-block text-blue-500 hover:underline">Go to login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 dark:text-red-400">{message}</p>
            <Link to="/login" className="mt-4 inline-block text-blue-500 hover:underline">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}

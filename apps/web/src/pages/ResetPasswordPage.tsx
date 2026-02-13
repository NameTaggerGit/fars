import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-soft-lg border border-white/20 dark:border-slate-700/50 p-8 text-center">
          <p className="text-green-600 dark:text-green-400 font-medium">Password reset successfully.</p>
          <Link to="/login" className="mt-4 inline-block text-blue-500 hover:underline">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-soft-lg border border-white/20 dark:border-slate-700/50 p-8">
        <h1 className="text-xl font-semibold text-center text-slate-800 dark:text-slate-100 mb-6">Set new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 px-4 py-3 text-slate-800 dark:text-slate-100"
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 px-4 py-3 text-slate-800 dark:text-slate-100"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Reset password'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="text-blue-500 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

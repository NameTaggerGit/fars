import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { motion } from 'framer-motion';
import { AuthBackground } from '../components/AuthBackground';

export function LoginPage() {
  const navigate = useNavigate();
  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      await loginSuccess(data);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden p-4">
      <AuthBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl border border-white/30 dark:border-slate-700/60 p-8 glass-effect"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 15 }}
          className="text-5xl text-center mb-3"
        >
          💬
        </motion.div>
        <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">
          FARS
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">Messenger</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-red-50/90 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-4 font-medium border border-red-200/50 dark:border-red-800/50"
            >
              ❌ {error}
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white dark:focus:bg-slate-700/60 transition-all shadow-sm"
              required
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white dark:focus:bg-slate-700/60 transition-all shadow-sm"
              required
            />
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40"
          >
            {loading ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.span>
            ) : (
              'Log in'
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
        >
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            No account?{' '}
            <Link to="/register" className="font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Register
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

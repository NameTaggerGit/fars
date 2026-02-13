import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { motion } from 'framer-motion';
import { AuthBackground } from '../components/AuthBackground';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register({ email, password, name, username });
      setDone(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden p-4">
        <AuthBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-slate-700/50 p-8 text-center glass-effect"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-6xl mb-4"
          >
            ✅
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Проверьте email</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Мы отправили вам письмо для подтверждения аккаунта</p>
          <Link to="/login" className="inline-block rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 transition-all">
            Вернуться на вход
          </Link>
        </motion.div>
      </div>
    );
  }

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
          Создать аккаунт
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">Join FARS Messenger</p>

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
          {['Email', 'Name', 'Username', 'Password'].map((label, idx) => {
            const fields: Record<string, { value: string; onChange: (v: string) => void; type: string; minLength?: number }> = {
              'Email': { value: email, onChange: setEmail, type: 'email' },
              'Name': { value: name, onChange: setName, type: 'text' },
              'Username': { value: username, onChange: (v) => setUsername(v.replace(/\s/g, '')), type: 'text' },
              'Password': { value: password, onChange: setPassword, type: 'password', minLength: 8 },
            };
            const field = fields[label];
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
              >
                <input
                  type={field.type}
                  placeholder={label}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white dark:focus:bg-slate-700/60 transition-all shadow-sm"
                  required
                  minLength={field.minLength}
                />
              </motion.div>
            );
          })}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 mt-6"
          >
            {loading ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.span>
            ) : (
              'Зарегистрироваться'
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
        >
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Войти
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

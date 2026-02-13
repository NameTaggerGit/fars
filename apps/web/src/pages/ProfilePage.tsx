import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../api/users';
import { filesApi } from '../api/files';
import { motion } from 'framer-motion';

const NAME_COLORS = [
  '#1e293b', '#0369a1', '#0d9488', '#15803d', '#ca8a04', '#c2410c', '#be123c', '#7c3aed',
];

export function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(typeof user?.bio === 'string' ? user.bio : '');
  const [nameColor, setNameColor] = useState(typeof user?.nameColor === 'string' ? user.nameColor : NAME_COLORS[0]);
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth && typeof user.dateOfBirth === 'string' 
      ? new Date(user.dateOfBirth).toISOString().slice(0, 10) 
      : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        bio: typeof bio === 'string' ? bio.trim() || undefined : undefined,
        nameColor: typeof nameColor === 'string' ? nameColor || undefined : undefined,
        dateOfBirth: dateOfBirth || undefined,
      }),
    onSuccess: async () => {
      await fetchMe();
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setSaving(false);
      setError('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message || 'Ошибка сохранения');
      setSaving(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    updateMutation.mutate();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await filesApi.uploadAvatar(file);
      await usersApi.setAvatar(data.url);
      await fetchMe();
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch {
      setError('Не удалось загрузить аватар');
    }
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white/30 dark:from-slate-900/30 dark:to-slate-800/20">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">👤 Профиль</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Управление вашим аккаунтом</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-white/30 dark:border-slate-700/30 p-6 shadow-lg glass-effect space-y-6"
        >
          {/* Аватар */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0 ring-4 ring-white/50 dark:ring-slate-700/50 hover:ring-blue-400/50 transition-all shadow-md hover:shadow-lg"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center text-3xl text-white font-bold w-full h-full">
                  {user?.name?.slice(0, 1) || '?'}
                </span>
              )}
            </motion.button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Аватар профиля</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Нажмите, чтобы загрузить фото</p>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-red-50/90 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-4 font-medium border border-red-200/50 dark:border-red-800/50"
            >
              ❌ {error}
            </motion.div>
          )}

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-all shadow-sm"
                placeholder="Ваше имя"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Тег (@username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-all shadow-sm"
                placeholder="username"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Уникальный тег для поиска и добавления в друзья</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Дата рождения</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">О себе</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-all shadow-sm resize-none"
                placeholder="Кратко о себе"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Цвет имени</label>
              <div className="flex flex-wrap gap-3">
                {NAME_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setNameColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all shadow-sm ${
                      nameColor === color
                        ? 'border-slate-900 dark:border-white scale-110 shadow-md'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Цвет ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-3 font-semibold disabled:opacity-50 transition-all shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40"
            >
              {saving ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.span>
              ) : (
                '💾 Сохранить'
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-2xl border border-slate-200 dark:border-slate-600 px-5 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all font-semibold"
            >
              ← Назад
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { logout(); navigate('/login'); }}
              className="rounded-2xl border border-red-200 dark:border-red-900/50 px-5 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold"
            >
              🚪 Выход
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

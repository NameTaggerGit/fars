import { useState, useRef } from 'react';
import { useSettingsStore, applyTheme, applyFontSize, type Theme, type FontSize, type Language } from '../store/settingsStore';
import { useSettingsSync } from '../hooks/useSettingsSync';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { stickersApi, type StickerPackInfo } from '../api/stickers';
import { filesApi } from '../api/files';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'system', label: 'Как в системе' },
];

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Маленький' },
  { value: 'medium', label: 'Средний' },
  { value: 'large', label: 'Крупный' },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export function SettingsPage() {
  useSettingsSync();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const theme = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const language = useSettingsStore((s) => s.language);
  const notifications = useSettingsStore((s) => s.notifications);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setNotifications = useSettingsStore((s) => s.setNotifications);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const [editPackId, setEditPackId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirmPack, setDeleteConfirmPack] = useState<{ id: string; name: string; isCreator: boolean } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: myPacksData = [] } = useQuery({
    queryKey: ['stickers', 'my-packs'],
    queryFn: async () => {
      const { data } = await stickersApi.listMyPacks();
      return data as Array<{ stickerPack: StickerPackInfo & { createdBy?: { id: string; name: string } } }>;
    },
  });

  const handleCreatePack = async () => {
    if (!createName.trim() || createFiles.length === 0) return;
    setCreateLoading(true);
    try {
      const urls: Array<{ url: string; order: number }> = [];
      for (let i = 0; i < createFiles.length; i++) {
        const { data } = await filesApi.upload(createFiles[i]);
        urls.push({ url: data.url, order: i });
      }
      await stickersApi.createPack(createName.trim(), urls);
      queryClient.invalidateQueries({ queryKey: ['stickers', 'my-packs'] });
      setCreateModalOpen(false);
      setCreateName('');
      setCreateFiles([]);
    } catch (e) {
      console.error(e);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditPackSave = async () => {
    if (!editPackId || !editName.trim()) return;
    setEditLoading(true);
    try {
      await stickersApi.updatePack(editPackId, editName.trim());
      queryClient.invalidateQueries({ queryKey: ['stickers', 'my-packs'] });
      setEditPackId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditPackAddStickers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!editPackId || !files?.length) return;
    try {
      for (let i = 0; i < files.length; i++) {
        const { data } = await filesApi.upload(files[i]);
        await stickersApi.addStickerToPack(editPackId, { url: data.url });
      }
      queryClient.invalidateQueries({ queryKey: ['stickers', 'my-packs'] });
      queryClient.invalidateQueries({ queryKey: ['stickers', 'pack', editPackId] });
    } catch (err) {
      console.error(err);
    }
    e.target.value = '';
  };

  const handleRemoveSticker = async (packId: string, stickerId: string) => {
    try {
      await stickersApi.removeStickerFromPack(packId, stickerId);
      queryClient.invalidateQueries({ queryKey: ['stickers', 'pack', packId] });
      queryClient.invalidateQueries({ queryKey: ['stickers', 'my-packs'] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePack = async () => {
    if (!deleteConfirmPack) return;
    setDeleteLoading(true);
    try {
      await stickersApi.removeOrDeletePack(deleteConfirmPack.id);
      queryClient.invalidateQueries({ queryKey: ['stickers', 'my-packs'] });
      setDeleteConfirmPack(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white/30 dark:from-slate-900/30 dark:to-slate-800/20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">⚙️ Настройки</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Персонализация интерфейса мессенджера</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 max-w-lg"
      >
        {/* Тема */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-white/30 dark:border-slate-700/30 p-6 shadow-lg glass-effect"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">🎨 Тема</h2>
          <div className="flex flex-wrap gap-3">
            {THEMES.map((t, idx) => (
              <motion.button
                key={t.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setTheme(t.value);
                  applyTheme(t.value);
                }}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                  theme === t.value
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {t.label}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Размер текста */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-white/30 dark:border-slate-700/30 p-6 shadow-lg glass-effect"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">📝 Размер текста</h2>
          <div className="flex flex-wrap gap-3">
            {FONT_SIZES.map((f, idx) => (
              <motion.button
                key={f.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setFontSize(f.value);
                  applyFontSize(f.value);
                }}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                  fontSize === f.value
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Язык */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-white/30 dark:border-slate-700/30 p-6 shadow-lg glass-effect"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">🌐 Язык</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/40 px-5 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60 font-semibold"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </motion.section>

        {/* Уведомления */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-white/30 dark:border-slate-700/30 p-6 shadow-lg glass-effect"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">🔔 Уведомления</h2>
          <motion.label 
            whileHover={{ x: 4 }}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-slate-200 dark:bg-slate-600 rounded-full transition-colors peer-checked:bg-blue-500 peer-checked:shadow-lg peer-checked:shadow-blue-500/30 relative">
                <motion.div
                  animate={{ x: notifications ? 20 : 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="absolute w-6 h-6 bg-white rounded-full top-0.5 left-0.5 shadow-sm"
                />
              </div>
            </div>
            <span className="text-slate-700 dark:text-slate-200 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Новые сообщения
            </span>
          </motion.label>
        </motion.section>

        {/* Стикеры */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-white/30 dark:border-slate-700/30 p-6 shadow-lg glass-effect"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">😀 Стикеры</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Создайте свой стикерпак или добавьте предустановленный (скоро).
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCreateModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 text-sm font-semibold shadow-md shadow-blue-500/30 mb-4"
          >
            + Создать стикерпак
          </motion.button>
          <div className="space-y-2">
            {myPacksData.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Нет стикерпаков. Создайте первый.</p>
            ) : (
              myPacksData.map(({ stickerPack }) => {
                const isCreator = currentUserId && stickerPack.createdBy?.id === currentUserId;
                return (
                  <motion.div
                    key={stickerPack.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded-2xl p-3 bg-slate-100/80 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{stickerPack.name}</span>
                      {isCreator && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">Мой</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isCreator && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setEditPackId(stickerPack.id);
                            setEditName(stickerPack.name);
                          }}
                          className="rounded-xl px-3 py-1.5 text-sm font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500"
                        >
                          Редактировать
                        </motion.button>
                      )}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDeleteConfirmPack({
                          id: stickerPack.id,
                          name: stickerPack.name,
                          isCreator: !!isCreator,
                        })}
                        className="rounded-xl px-3 py-1.5 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        {isCreator ? 'Удалить' : 'Убрать'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Конфиденциальность / Данные — заглушки */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl bg-gradient-to-br from-slate-100/50 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/30 backdrop-blur border border-slate-200/50 dark:border-slate-700/30 p-6 shadow-lg glass-effect"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">🔐 Конфиденциальность</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Настройки конфиденциальности (кто может писать, видеть статус) и управление данными будут добавлены в будущих обновлениях.
          </p>
        </motion.section>
      </motion.div>

      {/* Модалка: создать стикерпак */}
      <AnimatePresence>
        {createModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !createLoading && setCreateModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-600 p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Создать стикерпак</h3>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Название стикерпака"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 mb-4"
              />
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Картинки или GIF</p>
                <input
                  ref={createFileInputRef}
                  type="file"
                  accept="image/*,.gif"
                  multiple
                  className="hidden"
                  onChange={(e) => setCreateFiles(Array.from(e.target.files || []))}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => createFileInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  {createFiles.length ? `Выбрано: ${createFiles.length}` : 'Выберите файлы'}
                </motion.button>
              </div>
              <div className="flex gap-2 justify-end">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !createLoading && setCreateModalOpen(false)}
                  className="rounded-2xl px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Отмена
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreatePack}
                  disabled={createLoading || !createName.trim() || createFiles.length === 0}
                  className="rounded-2xl bg-blue-500 text-white px-4 py-2 font-semibold disabled:opacity-50"
                >
                  {createLoading ? 'Создание...' : 'Создать'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка: редактировать стикерпак */}
      <AnimatePresence>
        {editPackId && (
          <EditPackModal
            packId={editPackId}
            editName={editName}
            setEditName={setEditName}
            onSave={handleEditPackSave}
            onClose={() => setEditPackId(null)}
            onAddStickers={handleEditPackAddStickers}
            onRemoveSticker={handleRemoveSticker}
            editFileInputRef={editFileInputRef}
            loading={editLoading}
          />
        )}
      </AnimatePresence>

      {/* Модалка: подтверждение удаления */}
      <AnimatePresence>
        {deleteConfirmPack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !deleteLoading && setDeleteConfirmPack(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-600 p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Удалить стикерпак?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {deleteConfirmPack.isCreator
                  ? `«${deleteConfirmPack.name}» будет удалён у всех пользователей.`
                  : `«${deleteConfirmPack.name}» будет убран из вашего списка.`}
              </p>
              <div className="flex gap-2 justify-end">
                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => !deleteLoading && setDeleteConfirmPack(null)} className="rounded-2xl px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Отмена</motion.button>
                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={handleDeletePack} disabled={deleteLoading} className="rounded-2xl bg-red-500 text-white px-4 py-2 font-semibold disabled:opacity-50">{deleteLoading ? '...' : 'Удалить'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditPackModal({
  packId,
  editName,
  setEditName,
  onSave,
  onClose,
  onAddStickers,
  onRemoveSticker,
  editFileInputRef,
  loading,
}: {
  packId: string;
  editName: string;
  setEditName: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  onAddStickers: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSticker: (packId: string, stickerId: string) => void;
  editFileInputRef: React.RefObject<HTMLInputElement>;
  loading: boolean;
}) {
  const { data: stickers = [] } = useQuery({
    queryKey: ['stickers', 'pack', packId],
    queryFn: () => stickersApi.listStickersInPack(packId).then((r) => r.data),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !loading && onClose()}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-600 p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Редактировать стикерпак</h3>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Название"
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-slate-800 dark:text-slate-100 mb-4"
        />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Стикеры</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {stickers.map((s) => (
            <div key={s.id} className="relative group">
              <img src={s.url} alt="" className="w-16 h-16 object-contain rounded-lg bg-slate-100 dark:bg-slate-700" />
              <motion.button
                type="button"
                onClick={() => onRemoveSticker(packId, s.id)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </motion.button>
            </div>
          ))}
        </div>
        <input ref={editFileInputRef} type="file" accept="image/*,.gif" multiple className="hidden" onChange={onAddStickers} />
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => editFileInputRef.current?.click()} className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 mb-4">Добавить стикеры</motion.button>
        <div className="flex gap-2 justify-end">
          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClose} disabled={loading} className="rounded-2xl px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Отмена</motion.button>
          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onSave} disabled={loading || !editName.trim()} className="rounded-2xl bg-blue-500 text-white px-4 py-2 font-semibold disabled:opacity-50">{loading ? 'Сохранение...' : 'Сохранить'}</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

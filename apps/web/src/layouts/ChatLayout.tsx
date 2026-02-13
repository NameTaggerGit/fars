import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { chatsApi, type ChatListItem } from '../api/chats';
import { FriendsSidebar } from '../components/FriendsSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket, useSocketEvent } from '../hooks/useSocket';
import { formatLastSeen } from '../utils/formatLastSeen';
import { isBirthdayToday } from '../utils/birthday';

function messagePreviewBody(message: { type?: string; content?: string }): string {
  const t = message?.type;
  if (t === 'sticker') return 'Стикер';
  if (t === 'voice') return 'Голосовое сообщение';
  if (t === 'image') return 'Изображение';
  if (t === 'video') return 'Видео';
  if (t === 'document') return 'Документ';
  return (message?.content as string)?.slice(0, 60) ?? 'Новое сообщение';
}

export function ChatLayout() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const canAccessAdmin = useAuthStore((s) => s.user?.canAccessAdmin);
  const notificationsEnabled = useSettingsStore((s) => s.notifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [chatTyping, setChatTyping] = useState<Record<string, string | null>>({}); // chatId -> userId
  const [chatRecording, setChatRecording] = useState<Record<string, string | null>>({}); // chatId -> userId

  const { data: chats = [], refetch: refetchChats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data } = await chatsApi.list();
      return data as ChatListItem[];
    },
  });

  useSocketEvent(socket, 'online', (payload: { userId: string; online: boolean }) => {
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      if (payload.online) next.add(payload.userId);
      else next.delete(payload.userId);
      return next;
    });
  });

  useSocketEvent(socket, 'typing', (payload: { chatId: string; userId: string; isTyping: boolean }) => {
    setChatTyping((prev) => ({ ...prev, [payload.chatId]: payload.isTyping ? payload.userId : null }));
  });

  useSocketEvent(socket, 'recording', (payload: { chatId: string; userId: string; isRecording: boolean }) => {
    setChatRecording((prev) => ({ ...prev, [payload.chatId]: payload.isRecording ? payload.userId : null }));
  });

  useSocketEvent(socket, 'message:new', (payload: { chatId: string; message: { type?: string; content?: string } }) => {
    queryClient.invalidateQueries({ queryKey: ['chats'] });
    if (!notificationsEnabled || !payload?.chatId || !payload?.message) return;
    const isOtherChat = payload.chatId !== chatId;
    const isBackground = typeof document !== 'undefined' && document.hidden;
    if (!isOtherChat && !isBackground) return;
    const chatsList = queryClient.getQueryData<ChatListItem[]>(['chats']) ?? [];
    const chat = chatsList.find((c) => c.id === payload.chatId);
    const title = chat?.name ?? 'Новый чат';
    const body = messagePreviewBody(payload.message);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') new Notification(title, { body });
      });
    }
  });

  // Join all chat rooms so sidebar can receive typing/recording events.
  useEffect(() => {
    if (!socket) return;
    for (const c of chats) socket.emit('join_chat', { chatId: c.id });
    return () => {
      for (const c of chats) socket.emit('leave_chat', { chatId: c.id });
    };
  }, [socket, chats]);

  const formatLastMessagePreview = useMemo(() => {
    return (chat: ChatListItem) => {
      const t = chat.lastMessage?.type;
      if (!t) return chat.lastMessage?.content ?? '';
      if (t === 'sticker') return 'Стикер';
      if (t === 'voice') return 'Голосовое сообщение';
      if (t === 'image') return 'Изображение';
      if (t === 'video') return 'Видео';
      if (t === 'document') return 'Документ';
      return chat.lastMessage?.content ?? '';
    };
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen
            ? 'w-72 md:w-80 fixed md:relative inset-y-0 md:inset-auto left-0 md:left-auto z-40'
            : 'w-16 md:w-16 relative'
        } flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 glass-effect transition-all duration-300 ease-out overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 min-h-[56px]">
          {sidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 truncate"
            >
              FARS
            </motion.span>
          )}
          <div className="flex gap-2">
            {sidebarOpen && (
              <>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFriendsSidebarOpen(true)}
                  className="rounded-xl p-2.5 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Друзья"
                >
                  👥
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/add-friend')}
                  className="rounded-xl p-2.5 hover:bg-green-100 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
                  title="Добавить в друзья"
                >
                  ➕
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/new-group')}
                  className="rounded-xl p-2.5 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors"
                  title="Создать группу"
                >
                  👫
                </motion.button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {sidebarOpen ? (
          <>
            <nav className="flex-1 overflow-y-auto p-3">
              <AnimatePresence mode="popLayout">
                {chats.map((chat, idx) => (
                  <div key={chat.id} className="relative">
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.05 }}
                      type="button"
                      onClick={() => navigate(`/chat/${chat.id}`)}
                      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 group ${
                        chatId === chat.id
                          ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/15 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-600 dark:text-blue-400 shadow-soft'
                          : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center ${
                            chat.type === 'private' && chat.otherUser?.id && onlineUserIds.has(chat.otherUser.id)
                              ? (chatTyping[chat.id] || chatRecording[chat.id])
                                ? 'ring-2 ring-blue-400 animate-pulse'
                                : 'ring-2 ring-emerald-400'
                              : ''
                          }`}
                        >
                          {chat.avatarUrl ? (
                            <img src={chat.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold">
                              {(chat.name || '?').slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {chat.type === 'private' && chat.otherUser?.dateOfBirth && isBirthdayToday(chat.otherUser.dateOfBirth) && (
                          <span className="absolute -top-1 -right-1 text-lg" title="День рождения!">🎂</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold truncate">{chat.name || 'Chat'}</p>
                          {typeof chat.unreadCount === 'number' && chat.unreadCount > 0 && (
                            <span className="flex-shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {chatTyping[chat.id]
                              ? 'Печатает...'
                              : chatRecording[chat.id]
                                ? 'Записывает голосовое...'
                                : formatLastMessagePreview(chat)}
                          </p>
                        )}
                        {chat.type === 'private' && chat.otherUser?.id && !onlineUserIds.has(chat.otherUser.id) && chat.otherUser.lastActiveAt && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            Был(а) в сети {formatLastSeen(chat.otherUser.lastActiveAt)}
                          </p>
                        )}
                      </div>
                      
                      {/* Menu button */}
                      <motion.button
                        whileHover={{ rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === chat.id ? null : chat.id);
                        }}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100"
                      >
                        ⋮
                      </motion.button>
                    </motion.button>
                  </div>
                ))}
              </AnimatePresence>
            </nav>
            <div className="p-3 space-y-3 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="rounded-2xl p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-white">{user?.name?.slice(0, 1) || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{user?.name || user?.username}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user?.username}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="rounded-xl py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  👤 Профиль
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="rounded-xl py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  ⚙️ Настройки
                </motion.button>
                {canAccessAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="rounded-xl py-2.5 px-3 text-sm font-medium bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
                  >
                    👑 Active
                  </motion.button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Мини-режим: только аватарки чатов и важные кнопки */}
            <nav className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-3">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-slate-200/70 dark:border-slate-700/70 bg-slate-100/70 dark:bg-slate-700/70 transition-transform hover:scale-105 ${
                    chatId === chat.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  title={chat.name || 'Chat'}
                >
                  {chat.avatarUrl ? (
                    <img src={chat.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold">
                      {(chat.name || '?').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setFriendsSidebarOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="Друзья"
              >
                👥
              </button>
              <button
                type="button"
                onClick={() => navigate('/add-friend')}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-green-600 dark:text-green-400 text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="Добавить"
              >
                ➕
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="Настройки"
              >
                ⚙️
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>

      {/* Mobile dim background when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Friends Sidebar */}
      <FriendsSidebar isOpen={friendsSidebarOpen} onClose={() => setFriendsSidebarOpen(false)} />

      {/* Chat context menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(null)}
            className="fixed inset-0 z-40 bg-black/0"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(null)}
            className="fixed inset-0 z-40"
            role="presentation"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 left-12 w-56 bg-white dark:bg-slate-700 rounded-2xl shadow-2xl z-50 border border-slate-200 dark:border-slate-600 overflow-hidden"
          >
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLoading(true);
                const targetChatId = menuOpen!;
                chatsApi.mute(targetChatId, 8 * 3600 * 1000)
                  .then(() => {
                    refetchChats();
                    setMenuOpen(null);
                  })
                  .catch((err) => console.error('Failed to mute:', err))
                  .finally(() => setLoading(false));
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors text-slate-900 dark:text-slate-100 font-medium text-sm border-b border-slate-200 dark:border-slate-600 flex items-center gap-2"
            >
              🔇 На 8 ч.
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLoading(true);
                const targetChatId = menuOpen!;
                chatsApi.pin(targetChatId)
                  .then(() => {
                    refetchChats();
                    setMenuOpen(null);
                  })
                  .catch((err) => console.error('Failed to pin:', err))
                  .finally(() => setLoading(false));
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors text-slate-900 dark:text-slate-100 font-medium text-sm border-b border-slate-200 dark:border-slate-600 flex items-center gap-2"
            >
              📌 Закреп.
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLoading(true);
                const deletedChatId = menuOpen!;
                chatsApi.delete(deletedChatId)
                  .then(() => {
                    refetchChats();
                    if (deletedChatId === chatId) navigate('/', { replace: true });
                    setMenuOpen(null);
                  })
                  .catch((err) => console.error('Failed to delete:', err))
                  .finally(() => setLoading(false));
              }}
              className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors text-red-600 dark:text-red-400 font-medium text-sm flex items-center gap-2"
            >
              🗑️ Удалить
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

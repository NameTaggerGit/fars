import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { friendsApi } from '../api/friends';
import { chatsApi } from '../api/chats';
import { motion, AnimatePresence } from 'framer-motion';
import { isBirthdayToday, formatDaysUntilBirthday, getBirthdayMonthDay } from '../utils/birthday';

interface FriendsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  nameColor?: string;
  dateOfBirth?: string | null;
}

export function FriendsSidebar({ isOpen, onClose }: FriendsSidebarProps) {
  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'birthdays'>('friends');

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data } = await friendsApi.list('accepted');
      return data as Friend[];
    },
  });

  // Сортировка друзей по дням рождения
  const friendsByBirthday = useMemo(() => {
    const withBirthday = friends.filter((f) => f.dateOfBirth);
    return withBirthday.sort((a, b) => {
      const aDate = getBirthdayMonthDay(a.dateOfBirth);
      const bDate = getBirthdayMonthDay(b.dateOfBirth);
      if (!aDate) return 1;
      if (!bDate) return -1;
      if (aDate.month !== bDate.month) return aDate.month - bDate.month;
      return aDate.day - bDate.day;
    });
  }, [friends]);

  const { data: profileData } = useQuery({
    queryKey: ['user', selectedFriend?.id],
    queryFn: async () => {
      if (!selectedFriend) return null;
      const res = await friendsApi.getProfile(selectedFriend.id);
      return res.data as Friend;
    },
    enabled: !!selectedFriend?.id,
  });

  const openChatMutation = useMutation({
    mutationFn: async (friendId: string) => {
      try {
        // Try to find existing private chat
        const { data: chats } = await chatsApi.list();
        const chatList = chats as Array<{ id: string; type: string; members?: Array<{ id: string }> }>;
        
        const privateChat = chatList.find((chat) => {
          // Find private chat with exactly 2 members, one of them is the friend
          return chat.type === 'private' && 
                 (chat.members || []).some(m => m.id === friendId);
        });

        if (privateChat) {
          return privateChat.id;
        }
      } catch (e) {
        // Continue to create new chat
      }

      // Create new private chat if not found
      const { data } = await chatsApi.createPrivate(friendId);
      return data.id;
    },
    onSuccess: (chatId) => {
      navigate(`/chat/${chatId}`);
      onClose();
    },
    onError: (error) => {
      console.error('Failed to open chat:', error);
    },
  });

  const handleViewProfile = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const handleOpenChat = (friendId: string) => {
    openChatMutation.mutate(friendId);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Друзья</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  ✕
                </button>
              </div>
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === 'friends'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Все друзья
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('birthdays')}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === 'birthdays'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Дни рождения
                </button>
              </div>
            </div>

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-slate-400">Загрузка...</div>
                </div>
              ) : activeTab === 'friends' ? (
                friends.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>У вас нет друзей</p>
                    <p className="text-sm mt-2">Добавьте друзей в главном меню</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 p-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-semibold overflow-hidden">
                              {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                              ) : (
                                friend.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            {friend.dateOfBirth && isBirthdayToday(friend.dateOfBirth) && (
                              <span className="absolute -top-1 -right-1 text-lg" title="День рождения!">🎂</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{friend.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{friend.username}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewProfile(friend)}
                              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                              title="Профиль"
                            >
                              👤
                            </motion.button>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleOpenChat(friend.id)}
                              disabled={openChatMutation.isPending}
                              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
                              title="Открыть чат"
                            >
                              💬
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              ) : friendsByBirthday.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>Нет друзей с указанной датой рождения</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {friendsByBirthday.map((friend) => {
                    const monthDay = getBirthdayMonthDay(friend.dateOfBirth);
                    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
                    const birthdayDate = friend.dateOfBirth ? new Date(friend.dateOfBirth) : null;
                    return (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 p-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-semibold overflow-hidden">
                              {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                              ) : (
                                friend.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            {isBirthdayToday(friend.dateOfBirth) && (
                              <span className="absolute -top-1 -right-1 text-lg" title="День рождения!">🎂</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{friend.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {birthdayDate && `${monthDay?.day} ${monthNames[monthDay?.month ?? 0]}`}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                              {formatDaysUntilBirthday(friend.dateOfBirth)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewProfile(friend)}
                              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                              title="Профиль"
                            >
                              👤
                            </motion.button>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleOpenChat(friend.id)}
                              disabled={openChatMutation.isPending}
                              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
                              title="Открыть чат"
                            >
                              💬
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Profile Modal */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFriend(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700"
            >
              {/* Close button */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedFriend(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Avatar & Info — use profileData when loaded */}
              {(() => {
                const p = profileData ?? selectedFriend;
                return (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl overflow-hidden shadow-lg">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {p.dateOfBirth && isBirthdayToday(p.dateOfBirth) && (
                          <span className="absolute -top-2 -right-2 text-2xl" title="День рождения!">🎂</span>
                        )}
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3
                        className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1"
                        style={p.nameColor ? { color: p.nameColor } : undefined}
                      >
                        {p.name}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-4">@{p.username}</p>
                      {p.bio && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-left">
                          {p.bio}
                        </p>
                      )}
                      {p.dateOfBirth && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Дата рождения: {new Date(p.dateOfBirth).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Actions */}
              <div className="space-y-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleOpenChat(selectedFriend.id);
                    setSelectedFriend(null);
                  }}
                  disabled={openChatMutation.isPending}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 transition-all disabled:opacity-50"
                >
                  {openChatMutation.isPending ? 'Открытие... ⏳' : 'Открыть чат 💬'}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFriend(null)}
                  className="w-full rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium py-3 transition-colors"
                >
                  Закрыть
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

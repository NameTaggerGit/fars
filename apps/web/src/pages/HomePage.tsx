import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../api/chats';
import { friendsApi } from '../api/friends';
import { motion, AnimatePresence } from 'framer-motion';

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addTag, setAddTag] = useState('');
  const [addError, setAddError] = useState('');
  const [groupModal, setGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data } = await friendsApi.list('accepted');
      return data as Array<{ id: string; name: string; username: string; avatarUrl?: string }>;
    },
  });

  const addFriendMutation = useMutation({
    mutationFn: (usernameOrId: string) => friendsApi.add(usernameOrId),
    onSuccess: () => {
      setAddTag('');
      setAddError('');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setAddError(err?.response?.data?.message || 'Не удалось добавить');
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
      const { data } = await chatsApi.createGroup(name, memberIds);
      return data;
    },
    onSuccess: (chat: { id?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setGroupModal(false);
      setGroupName('');
      setSelectedFriendIds(new Set());
      if (chat?.id) navigate(`/chat/${chat.id}`);
    },
  });

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    createGroupMutation.mutate({ name: groupName.trim(), memberIds: Array.from(selectedFriendIds) });
  };

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">FARS</h2>

      {/* Добавить в друзья по тегу */}
      <section className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 mb-4 shadow-soft">
        <h3 className="font-medium text-slate-700 dark:text-slate-200 mb-2">Добавить в друзья</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Введите тег (@username) или имя пользователя</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={addTag}
            onChange={(e) => setAddTag(e.target.value.replace(/\s/g, ''))}
            placeholder="@username"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => addTag.trim() && addFriendMutation.mutate(addTag.trim())}
            disabled={addFriendMutation.isPending || !addTag.trim()}
            className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 font-medium disabled:opacity-50"
          >
            {addFriendMutation.isPending ? '...' : 'Добавить'}
          </button>
        </div>
        {addError && <p className="text-sm text-red-500 mt-1">{addError}</p>}
      </section>

      {/* Создать группу */}
      <section className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 shadow-soft">
        <h3 className="font-medium text-slate-700 dark:text-slate-200 mb-2">Групповой чат</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Создайте беседу из нескольких друзей</p>
        <button
          type="button"
          onClick={() => setGroupModal(true)}
          className="rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-4 py-2.5 font-medium transition-colors"
        >
          Создать группу
        </button>
      </section>

      <p className="text-slate-500 dark:text-slate-400 text-sm mt-4">
        Выберите чат в боковой панели или начните новый диалог с другом.
      </p>

      <AnimatePresence>
        {groupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setGroupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Новая группа</h3>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Название группы"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 mb-3 text-slate-800 dark:text-slate-100"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Выберите участников (друзей):</p>
              <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
                {friends.length === 0 ? (
                  <p className="text-sm text-slate-500">Нет друзей. Сначала добавьте друзей по тегу выше.</p>
                ) : (
                  friends.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriendIds.has(f.id)}
                        onChange={() => toggleFriend(f.id)}
                        className="rounded border-slate-300 text-blue-500"
                      />
                      <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm">
                        {f.name?.slice(0, 1) || '?'}
                      </span>
                      <span className="font-medium truncate">{f.name}</span>
                      <span className="text-slate-500 text-sm">@{f.username}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedFriendIds.size === 0 || createGroupMutation.isPending}
                  className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white py-2.5 font-medium disabled:opacity-50"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setGroupModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 py-2.5 px-4 text-slate-600 dark:text-slate-300"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

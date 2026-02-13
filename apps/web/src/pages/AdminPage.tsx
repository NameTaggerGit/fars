import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        usersTotal: number;
        messagesTotal: number;
        filesTotal: number;
        chatsTotal: number;
      }>('/admin/stats');
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/logs');
      return data;
    },
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Admin panel</h1>

      {isLoading ? (
        <p className="text-slate-500">Loading stats...</p>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 shadow-soft">
            <p className="text-sm text-slate-500 dark:text-slate-400">Users</p>
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{stats.usersTotal}</p>
          </div>
          <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 shadow-soft">
            <p className="text-sm text-slate-500 dark:text-slate-400">Messages</p>
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{stats.messagesTotal}</p>
          </div>
          <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 shadow-soft">
            <p className="text-sm text-slate-500 dark:text-slate-400">Files</p>
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{stats.filesTotal}</p>
          </div>
          <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 shadow-soft">
            <p className="text-sm text-slate-500 dark:text-slate-400">Chats</p>
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{stats.chatsTotal}</p>
          </div>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">Moderator logs</h2>
        <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden">
          {Array.isArray(logs) && logs.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {logs.slice(0, 20).map((log: { id: string; action: string; moderator?: { name: string }; targetUser?: { name: string }; createdAt: string }) => (
                <li key={log.id} className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{log.moderator?.name}</span> — {log.action} —{' '}
                  <span>{log.targetUser?.name}</span> — {new Date(log.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-slate-500">No logs yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

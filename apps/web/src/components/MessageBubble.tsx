import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../api/messages';
import { VoiceMessage } from './VoiceMessage';
import VideoNote from './VideoNote';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface MessageBubbleProps {
  msg: Message;
  currentUserId: string;
  onReply: (msg: Message) => void;
  onCopy: (msg: Message) => void;
  onDelete: (msg: Message) => void;
  onForward: (msg: Message) => void;
  onReaction: (msg: Message, emoji: string) => void;
  onMarkRead: (msg: Message) => void;
  onStickerClick?: (packId: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

/**
 * Apple Liquid Glass message bubble with animated status indicators
 * Inspired by iOS Messages, macOS design language
 */
export function MessageBubble({
  msg,
  currentUserId,
  onReply,
  onCopy,
  onDelete,
  onForward,
  onReaction,
  onMarkRead: _onMarkRead,
  onStickerClick,
  onScrollToMessage,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const isOwn = msg.senderId === currentUserId;

  // Liquid glass border styles based on status
  const getBorderStyles = () => {
    switch (msg.status) {
      case 'sending':
        return {
          border: '2px solid rgba(156, 163, 175, 0.6)',
          boxShadow: `
            0 0 16px rgba(156, 163, 175, 0.4),
            inset 0 0 20px rgba(156, 163, 175, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.06)
          `,
          animation: 'messagePulsing 1.5s ease-in-out infinite',
        };
      case 'sent':
        return {
          border: '2px solid rgba(59, 130, 246, 0.5)',
          boxShadow: `
            0 0 12px rgba(59, 130, 246, 0.3),
            inset 0 0 15px rgba(59, 130, 246, 0.05),
            0 8px 32px rgba(59, 130, 246, 0.1)
          `,
        };
      case 'read':
        return {
          border: '2px solid rgba(34, 197, 94, 0.5)',
          boxShadow: `
            0 0 12px rgba(34, 197, 94, 0.3),
            inset 0 0 15px rgba(34, 197, 94, 0.05),
            0 8px 32px rgba(34, 197, 94, 0.12)
          `,
        };
      case 'error':
        return {
          border: '2px solid rgba(239, 68, 68, 0.6)',
          boxShadow: `
            0 0 16px rgba(239, 68, 68, 0.4),
            inset 0 0 20px rgba(239, 68, 68, 0.1),
            0 8px 32px rgba(239, 68, 68, 0.12)
          `,
          animation: 'messageError 1.5s ease-in-out infinite',
        };
      default:
        return {
          border: '1.5px solid rgba(100, 116, 139, 0.2)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.05)`,
        };
    }
  };

  // Status icon with animation
  const StatusIcon = () => {
    if (!isOwn) return null;

    switch (msg.status) {
      case 'sending':
        return (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-block text-gray-500 text-xs ml-1.5 font-semibold"
          >
            ⏱
          </motion.div>
        );
      case 'sent':
        return (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-blue-500 text-xs ml-1.5 font-bold"
          >
            ✓
          </motion.span>
        );
      case 'read':
        return (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-green-500 text-xs ml-1.5 font-bold"
          >
            ✓✓
          </motion.span>
        );
      case 'error':
        return (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-500 text-xs ml-1.5 font-bold"
          >
            ✗
          </motion.span>
        );
      default:
        return null;
    }
  };

  // Message content rendering: image/video use attachment URL or legacy content URL; caption = content when attachments exist
  const mediaUrl = (msg.type === 'image' || msg.type === 'video')
    ? (msg.attachments?.[0]?.url ?? msg.content)
    : '';
  const caption = (msg.type === 'image' || msg.type === 'video') && msg.attachments?.length && msg.content
    ? msg.content
    : '';

  const isVideoNote =
    msg.type === 'video' && (msg.metadata?.kind as string | undefined) === 'video_note';

  const content =
    msg.type === 'image' || msg.type === 'video' ? (
      <div className="space-y-2">
        {msg.type === 'image' && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden max-w-xs"
          >
            <img
              src={mediaUrl}
              alt=""
              className="max-h-64 object-cover w-full hover:opacity-90 transition-opacity"
            />
          </a>
        )}
        {msg.type === 'video' && !isVideoNote && (
          <video src={mediaUrl} controls className="rounded-2xl max-h-64 max-w-xs" />
        )}
        {msg.type === 'video' && isVideoNote && (
          <VideoNote url={mediaUrl} size={128} />
        )}
        {caption ? <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pt-1">{caption}</p> : null}
      </div>
    ) : msg.type === 'voice' ? (
      <VoiceMessage url={msg.content} isOwn={isOwn} />
    ) : msg.type === 'document' ? (
      <a
        href={msg.content}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm underline break-all hover:opacity-80 transition-opacity inline-flex items-center gap-2"
      >
        <span>📎</span>
        <span>Документ</span>
      </a>
    ) : msg.type === 'sticker' ? (
      <button
        type="button"
        onClick={() => {
          const packId = msg.metadata?.stickerPackId as string | undefined;
          if (packId && onStickerClick) onStickerClick(packId);
        }}
        className="inline-block focus:outline-none focus:ring-0 p-0 border-0 bg-transparent hover:opacity-90 transition-opacity cursor-pointer"
      >
        <img
          src={msg.content}
          alt="sticker"
          className="max-w-[120px] max-h-[120px] object-contain block"
        />
      </button>
    ) : (
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div className="relative max-w-[75%]">
        {/* Main message bubble - Liquid Glass Style */}
        <motion.div
          style={getBorderStyles()}
          className={`
            px-4 py-3 backdrop-blur-xl transition-all duration-300
            rounded-3xl
            ${
              isOwn
                ? 'bg-gradient-to-br from-blue-500/90 to-blue-600/85 text-white shadow-lg'
                : 'bg-white/85 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100'
            }
          `}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {/* Forward label */}
          {msg.metadata?.forwarded === true && msg.metadata?.forwardedFrom && (
            <div className={`mb-2 text-xs font-medium opacity-80 flex items-center gap-1 ${
              isOwn ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'
            }`}>
              <span>➤</span>
              <span>Переслано от {msg.metadata.forwardedFrom as string}</span>
            </div>
          )}
          
          {/* Reply context */}
          {msg.replyToId && msg.replyTo && (
            <button
              type="button"
              onClick={() => {
                if (onScrollToMessage && msg.replyToId) {
                  onScrollToMessage(msg.replyToId);
                }
              }}
              className={`w-full text-left border-l-3 pl-2.5 mb-2.5 text-xs opacity-90 hover:opacity-100 transition-opacity cursor-pointer rounded-r-lg ${
                isOwn ? 'border-white/60 text-white/95 hover:bg-white/10' : 'border-slate-400/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-600/30'
              }`}
            >
              <p className="font-semibold truncate">{msg.replyTo.sender?.name || 'Сообщение'}</p>
              <p className="truncate opacity-85">{msg.replyTo.content || '—'}</p>
            </button>
          )}

          {/* Sender name for group chats */}
          {!isOwn && (
            <p
              className={`text-xs font-semibold mb-1 ${
                isOwn ? 'text-white/85' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {msg.sender?.name || msg.sender?.username}
            </p>
          )}

          {/* Message content */}
          {content}

          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {Array.from(
                new Map(msg.reactions.map((r) => [r.emoji, r])).entries()
              ).map(([emoji]) => (
                <motion.span
                  key={emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-sm rounded-full px-2 py-1 backdrop-blur-sm font-medium transition-colors ${
                    isOwn
                      ? 'bg-white/25 hover:bg-white/35'
                      : 'bg-slate-200/70 dark:bg-slate-600/60 hover:bg-slate-300/70 dark:hover:bg-slate-500/70'
                  }`}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          )}

          {/* Time and status */}
          <div
            className={`text-[11px] mt-2 flex items-center justify-end gap-1.5 font-medium ${
              isOwn ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <StatusIcon />
          </div>
        </motion.div>

        {/* Context menu */}
        <AnimatePresence>
          {(menuOpen || reactionOpen) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className={`absolute ${
                isOwn ? 'right-0' : 'left-0'
              } bottom-full mb-3 flex items-center gap-1.5 rounded-2xl backdrop-blur-2xl bg-slate-800/95 dark:bg-slate-900/97 px-2.5 py-2 shadow-2xl shadow-black/30 z-10 border border-slate-700/60`}
            >
              {!reactionOpen ? (
                <>
                  <MenuButton
                    onClick={() => {
                      onReply(msg);
                      setMenuOpen(false);
                    }}
                    title="Ответить"
                    icon="↩"
                  />
                  <MenuButton
                    onClick={() => {
                      onCopy(msg);
                      setMenuOpen(false);
                    }}
                    title="Копировать"
                    icon="📋"
                  />
                  {isOwn && (
                    <MenuButton
                      onClick={() => {
                        onDelete(msg);
                        setMenuOpen(false);
                      }}
                      title="Удалить"
                      icon="🗑"
                      danger
                    />
                  )}
                  <MenuButton
                    onClick={() => {
                      onForward(msg);
                      setMenuOpen(false);
                    }}
                    title="Переслать"
                    icon="➤"
                  />
                  <MenuButton
                    onClick={() => setReactionOpen(true)}
                    title="Реакция"
                    icon="😀"
                  />
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  {QUICK_EMOJIS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      type="button"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.15 }}
                      onClick={() => {
                        onReaction(msg, emoji);
                        setReactionOpen(false);
                        setMenuOpen(false);
                      }}
                      className="text-lg p-1.5 hover:bg-slate-700/60 rounded-xl transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setReactionOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors text-sm"
                  >
                    ←
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface MenuButtonProps {
  onClick: () => void;
  title: string;
  icon: string;
  danger?: boolean;
}

function MenuButton({ onClick, title, icon, danger = false }: MenuButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-600/40 hover:text-red-300'
          : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
      }`}
      title={title}
    >
      {icon}
    </motion.button>
  );
}

// AnimatePresence imported at top

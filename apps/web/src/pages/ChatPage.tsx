import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { chatsApi } from '../api/chats';
import { messagesApi, type Message } from '../api/messages';
import { filesApi } from '../api/files';
import { stickersApi } from '../api/stickers';
import { useSocket, useSocketEvent } from '../hooks/useSocket';
import { useCallContext } from '../contexts/CallContext';
import { MessageBubble } from '../components/MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';
import { formatLastSeen } from '../utils/formatLastSeen';
import { isBirthdayToday } from '../utils/birthday';

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const socket = useSocket();
  const { startCall } = useCallContext();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [forwardModal, setForwardModal] = useState<Message | null>(null);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [selectedStickerPackId, setSelectedStickerPackId] = useState<string | null>(null);
  const [stickerPackModalPackId, setStickerPackModalPackId] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [recordingUserId, setRecordingUserId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [fileCaption, setFileCaption] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressActiveRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const { data: chat } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const { data } = await chatsApi.get(chatId);
      return data;
    },
    enabled: !!chatId,
  });

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return { messages: [], nextCursor: null, hasMore: false };
      const { data } = await messagesApi.list(chatId);
      return data;
    },
    enabled: !!chatId,
  });

  const { data: chatsList = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data } = await chatsApi.list();
      return data;
    },
    enabled: !!forwardModal,
  });

  const { data: myStickerPacks = [] } = useQuery({
    queryKey: ['stickers', 'my-packs'],
    queryFn: async () => {
      const { data } = await stickersApi.listMyPacks();
      return data as Array<{ stickerPack: { id: string; name: string } }>;
    },
    enabled: stickerPickerOpen,
  });

  const { data: packStickers = [] } = useQuery({
    queryKey: ['stickers', 'pack', selectedStickerPackId],
    queryFn: async () => {
      if (!selectedStickerPackId) return [];
      const { data } = await stickersApi.listStickersInPack(selectedStickerPackId);
      return data as Array<{ id: string; url: string; emoji?: string }>;
    },
    enabled: stickerPickerOpen && !!selectedStickerPackId,
  });

  const {
    data: stickerPackModalData,
    isLoading: stickerPackModalLoading,
    isError: stickerPackModalIsError,
  } = useQuery({
    queryKey: ['stickers', 'pack-info', stickerPackModalPackId],
    queryFn: async () => {
      if (!stickerPackModalPackId) return null;
      const { data } = await stickersApi.getPack(stickerPackModalPackId);
      return data;
    },
    enabled: !!stickerPackModalPackId,
  });

  const messages = messagesData?.messages ?? [];
  const otherMember = chat?.members?.find((m: { id: string }) => m.id !== currentUserId);
  const isOnline = otherMember && onlineUserIds.has(otherMember.id);

  // Handle new messages
  useSocketEvent(socket, 'message:new', (payload: { chatId: string; message: Message }) => {
    if (payload.chatId !== chatId) return;
    queryClient.setQueryData(['messages', chatId], (old: typeof messagesData) =>
      old ? { ...old, messages: [...old.messages, payload.message] } : old,
    );
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  });

  // Handle message status updates (sending -> sent -> read)
  useSocketEvent(socket, 'message:status', (payload: { chatId: string; messageId: string; status: string }) => {
    if (payload.chatId !== chatId) return;
    queryClient.setQueryData(['messages', chatId], (old: typeof messagesData) => {
      if (!old) return old;
      return {
        ...old,
        messages: old.messages.map((msg) =>
          msg.id === payload.messageId ? { ...msg, status: payload.status as any } : msg
        ),
      };
    });
  });

  // Handle message read receipts
  useSocketEvent(socket, 'message:read', (payload: { chatId: string; messageId: string; userId: string }) => {
    if (payload.chatId !== chatId) return;
    queryClient.setQueryData(['messages', chatId], (old: typeof messagesData) => {
      if (!old) return old;
      return {
        ...old,
        messages: old.messages.map((msg) =>
          msg.id === payload.messageId && msg.senderId === currentUserId
            ? { ...msg, status: 'read' as const }
            : msg
        ),
      };
    });
  });

  // Handle chat background updates
  useSocketEvent(socket, 'chat:background:updated', (payload: { chatId: string; backgroundUrl: string }) => {
    if (payload.chatId !== chatId) return;
    queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
  });

  // Handle online status
  useSocketEvent(socket, 'online', (payload: { userId: string; online: boolean }) => {
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      if (payload.online) next.add(payload.userId);
      else next.delete(payload.userId);
      return next;
    });
  });

  useSocketEvent(socket, 'typing', (payload: { chatId: string; userId: string; isTyping: boolean }) => {
    if (payload.chatId !== chatId) return;
    setTypingUserId(payload.isTyping ? payload.userId : null);
  });

  useSocketEvent(socket, 'recording', (payload: { chatId: string; userId: string; isRecording: boolean }) => {
    if (payload.chatId !== chatId) return;
    setRecordingUserId(payload.isRecording ? payload.userId : null);
  });

  // Emit typing state (debounced)
  useEffect(() => {
    if (!socket || !chatId) return;
    const isTyping = input.trim().length > 0;
    const t = setTimeout(() => socket.emit('typing', { chatId, isTyping }), 300);
    return () => clearTimeout(t);
  }, [socket, chatId, input]);

  useEffect(() => {
    if (!socket || !chatId) return;
    socket.emit('join_chat', { chatId });
    return () => {
      socket.emit('leave_chat', { chatId });
    };
  }, [socket, chatId]);

  // Auto-mark last message as read when viewing chat
  useEffect(() => {
    if (!chatId || !currentUserId || messages.length === 0) return;

    // Find last message from other user that isn't read yet
    const lastOtherMessage = [...messages]
      .reverse()
      .find((m) => m.senderId !== currentUserId && m.status !== 'read');

    if (lastOtherMessage) {
      // Delay to ensure smooth animation
      const timeout = setTimeout(() => {
        messagesApi.markRead(chatId, lastOtherMessage.id).then(() => {
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }).catch(() => {
          // Silently fail if couldn't mark as read
        });
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [chatId, currentUserId, messages, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll-to-bottom button visibility
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      // Show button if not near bottom (within 100px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent, type: 'text' | 'image' | 'video' | 'document' | 'voice' | 'sticker' = 'text', contentOverride?: string) => {
    e.preventDefault();
    const text = (contentOverride ?? input).trim();
    if (!chatId || (!text && !contentOverride) || sending) return;
    setSending(true);
    try {
      await messagesApi.send(chatId, text, {
        replyToId: replyTo?.id,
        type: type !== 'text' ? type : undefined,
      });
      setInput('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (file: File): void | Promise<void> => {
    if (!chatId) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (isImage || isVideo) {
      const previewUrl = URL.createObjectURL(file);
      setPendingFile({ file, previewUrl });
      setFileCaption('');
    } else {
      return sendFileImmediately(file);
    }
  };

  const sendFileImmediately = async (file: File) => {
    if (!chatId) return;
    setSending(true);
    try {
      const { data } = await filesApi.upload(file);
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'voice' : 'document';
      await messagesApi.send(chatId, data.url, { type });
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setSending(false);
    }
  };

  const sendPendingFile = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!chatId || !pendingFile) return;
    const file = pendingFile.file;
    const previewUrl = pendingFile.previewUrl;
    const caption = fileCaption.trim();
    setSending(true);
    try {
      const { data } = await filesApi.upload(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      await messagesApi.send(chatId, caption, {
        type,
        attachments: [{ url: data.url, mimeType: file.type }],
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(null);
      setFileCaption('');
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setSending(false);
    }
  };

  const cancelPendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    setFileCaption('');
  };

  const handleCopy = (msg: Message) => {
    if (msg.content) navigator.clipboard.writeText(msg.content);
  };

  const startVoiceRecord = () => {
    if (!chatId) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        socket?.emit('recording', { chatId, isRecording: false });
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const file = new File([blob], 'voice.webm', { type: blob.type || 'audio/webm' });
        try {
          await sendFileImmediately(file);
        } catch (err) {
          console.error('Voice upload failed:', err);
        }
      };
      mr.start(100);
      setRecording(true);
      socket?.emit('recording', { chatId, isRecording: true });
    }).catch((err) => console.error('Microphone access failed:', err));
  };

  const stopVoiceRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      socket?.emit('recording', { chatId, isRecording: false });
    }
  };

  const sendVideoNoteFile = async (file: File) => {
    if (!chatId) return;
    setSending(true);
    try {
      const { data } = await filesApi.upload(file);
      await messagesApi.send(chatId, data.url, {
        type: 'video',
        metadata: { kind: 'video_note' },
      });
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (err) {
      console.error('Video note upload failed:', err);
    } finally {
      setSending(false);
    }
  };

  const startVideoRecord = () => {
    if (!chatId) return;
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: 480,
          height: 480,
          facingMode: 'user',
        },
      })
      .then((stream) => {
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        const chunks: BlobPart[] = [];
        mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          setRecording(false);
          socket?.emit('recording', { chatId, isRecording: false });
          const blob = new Blob(chunks, { type: mr.mimeType || 'video/webm' });
          const file = new File([blob], 'video-note.webm', { type: blob.type || 'video/webm' });
          try {
            await sendVideoNoteFile(file);
          } catch (err) {
            console.error('Video note upload failed:', err);
          }
        };
        mr.start(200);
        setRecording(true);
        socket?.emit('recording', { chatId, isRecording: true });
      })
      .catch((err) => console.error('Camera/microphone access failed:', err));
  };

  const stopVideoRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      socket?.emit('recording', { chatId, isRecording: false });
    }
  };

  const startRecordByMode = () => {
    if (recordMode === 'voice') startVoiceRecord();
    else startVideoRecord();
  };

  const stopRecordByMode = () => {
    if (recordMode === 'voice') stopVoiceRecord();
    else stopVideoRecord();
  };

  const clearLongPressTimer = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleRecordPressStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Если уже идёт запись — повторное нажатие останавливает её
    if (recording) {
      clearLongPressTimer();
      longPressActiveRef.current = false;
      stopRecordByMode();
      return;
    }

    longPressActiveRef.current = false;
    clearLongPressTimer();

    longPressTimeoutRef.current = window.setTimeout(() => {
      longPressActiveRef.current = true;
      startRecordByMode();
    }, 400);
  };

  const finishRecordPress = () => {
    // Нет таймера — ничего не делаем
    if (longPressTimeoutRef.current === null && !longPressActiveRef.current) return;

    // Останавливаем ожидание долгого нажатия
    clearLongPressTimer();

    if (longPressActiveRef.current) {
      // Было реальное долгое нажатие: останавливаем запись
      if (recording) {
        stopRecordByMode();
      }
    } else {
      // Короткое нажатие без старта записи — переключаем режим
      if (!recording) {
        setRecordMode((mode) => (mode === 'voice' ? 'video' : 'voice'));
      }
    }

    longPressActiveRef.current = false;
  };

  const handleRecordPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Игнорируем «мышиные» события, порождённые тачем в некоторых браузерах
    if (e.pointerType === 'mouse' || e.pointerType === 'touch' || e.pointerType === 'pen') {
      handleRecordPressStart(e);
    }
  };

  const handleRecordPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'touch' || e.pointerType === 'pen') {
      finishRecordPress();
    }
  };

  const handleRecordPointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'touch' || e.pointerType === 'pen') {
      finishRecordPress();
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    try {
      const { data: uploadData } = await filesApi.upload(file);
      const { data: chatData } = await chatsApi.setBackground(chatId, uploadData.url);
      queryClient.setQueryData(['chat', chatId], chatData);
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    } catch (err) {
      console.error('Failed to upload background:', err);
    }
    e.target.value = '';
  };

  const handleClearBackground = async () => {
    if (!chatId) return;
    try {
      const { data: chatData } = await chatsApi.setBackground(chatId, '');
      queryClient.setQueryData(['chat', chatId], chatData);
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    } catch (err) {
      console.error('Failed to clear background:', err);
    }
  };

  const handleForward = async (targetChatId: string) => {
    if (!forwardModal) return;
    try {
      const forwardedFrom = forwardModal.sender?.name || forwardModal.sender?.username || 'Неизвестный';
      
      // Если есть вложения (изображения/видео/документы), отправляем их с подписью как caption
      if (forwardModal.attachments && forwardModal.attachments.length > 0) {
        // Для медиа: caption = текст подписи + оригинальный caption (если был)
        const caption = forwardModal.content || '';
        await messagesApi.send(targetChatId, caption, {
          type: forwardModal.type as 'text' | 'image' | 'video' | 'document' | 'voice' | 'sticker',
          attachments: forwardModal.attachments.map((a) => ({
            url: a.url,
            mimeType: a.mimeType,
          })),
          metadata: {
            ...forwardModal.metadata,
            forwarded: true,
            forwardedFrom,
          },
        });
      } else {
        // Текстовое сообщение, стикер или голосовое: добавляем подпись в начало контента
        const forwardPrefix = `Переслано от ${forwardedFrom}\n`;
        const forwardContent = forwardModal.content || '';
        await messagesApi.send(targetChatId, forwardPrefix + forwardContent, {
          type: (forwardModal.type as 'text' | 'image' | 'video' | 'document' | 'voice' | 'sticker') || 'text',
          metadata: {
            ...forwardModal.metadata,
            forwarded: true,
            forwardedFrom,
          },
        });
      }
      setForwardModal(null);
      queryClient.invalidateQueries({ queryKey: ['messages', targetChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } finally {
      setForwardModal(null);
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-900/30 dark:to-slate-800/20 rounded-2xl m-2">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-6xl mb-4"
        >
          💬
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Выберите чат</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">Выберите существующий чат слева или начните новый разговор</p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Загрузка чата...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full min-w-0 relative">
      {/* Фон и лента сообщений на всю область; отступы сверху/снизу под острова */}
      <div
        ref={messagesContainerRef}
        className={`absolute inset-0 overflow-y-auto transition-all duration-200 ${dragOver ? 'ring-2 ring-blue-400/50 ring-inset' : ''} ${!chat?.backgroundUrl ? 'bg-gradient-to-b from-slate-50/50 to-white/30 dark:from-slate-900/30 dark:to-slate-800/20' : ''}`}
        style={
          chat?.backgroundUrl
            ? {
                backgroundImage: `url(${chat.backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : undefined
        }
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileSelect(file);
        }}
      >
        <div className={`pt-[72px] px-5 space-y-3 min-h-full ${pendingFile || replyTo ? 'pb-[180px]' : 'pb-[88px]'}`}>
        {isLoading ? (
          <motion.div 
            className="flex justify-center py-8"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-slate-400 dark:text-slate-500 font-medium">Загрузка сообщений...</span>
          </motion.div>
        ) : messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="text-4xl mb-3">💬</div>
            <p className="text-slate-400 dark:text-slate-500 font-medium">Нет сообщений</p>
            <p className="text-sm text-slate-500 dark:text-slate-600 mt-1">Начните разговор с {otherMember?.name || 'этим пользователем'}</p>
          </motion.div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              ref={(el) => {
                if (el) messageRefs.current[msg.id] = el;
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={highlightedMessageId === msg.id ? 'ring-4 ring-blue-400 rounded-3xl transition-all duration-500' : ''}
            >
              <MessageBubble
                msg={msg}
                currentUserId={currentUserId!}
                onReply={setReplyTo}
                onCopy={handleCopy}
                onDelete={async (m) => {
                  if (!chatId) return;
                  await messagesApi.delete(chatId, m.id);
                  queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
                }}
                onForward={setForwardModal}
                onReaction={async (m, emoji) => {
                  if (!chatId) return;
                  await messagesApi.addReaction(chatId, m.id, emoji);
                  queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
                }}
                onMarkRead={async (m) => {
                  if (!chatId) return;
                  await messagesApi.markRead(chatId, m.id);
                  queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
                }}
                onStickerClick={setStickerPackModalPackId}
                onScrollToMessage={(messageId) => {
                  const originalRef = messageRefs.current[messageId];
                  if (originalRef) {
                    originalRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedMessageId(messageId);
                    setTimeout(() => setHighlightedMessageId(null), 2000);
                  }
                }}
              />
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Верхний островок поверх чата */}
      <header className="absolute top-2 left-2 right-2 z-10 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-full border border-white/20 dark:border-slate-600/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-lg">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 overflow-hidden flex-shrink-0 relative shadow-sm flex items-center justify-center">
          {chat.avatarUrl || otherMember?.avatarUrl ? (
            <img src={(chat.avatarUrl || otherMember?.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">
              {(chat.name || 'Чат').slice(0, 1).toUpperCase()}
            </span>
          )}
          {isOnline && (
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 shadow-sm" 
              title="в сети" 
            />
          )}
          {otherMember?.dateOfBirth && isBirthdayToday(otherMember.dateOfBirth) && (
            <span className="absolute -top-1 -right-1 text-lg z-10" title="День рождения!">🎂</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm sm:text-base truncate">{chat.name || otherMember?.name || 'Чат'}</h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            {otherMember?.id && recordingUserId === otherMember.id
              ? '🎙️ Записывает голосовое...'
              : otherMember?.id && typingUserId === otherMember.id
                ? '⌨️ Печатает...'
                : isOnline
                  ? '🟢 В сети'
                  : otherMember?.lastActiveAt
                    ? `Был(а) в сети ${formatLastSeen(otherMember.lastActiveAt)}`
                    : `@${otherMember?.username || ''}`}
          </p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowBgMenu((v) => !v)}
              className="rounded-full p-2.5 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Изменить фон"
            >
              🎨
            </motion.button>
            {showBgMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-slate-800/95 shadow-lg border border-slate-200/80 dark:border-slate-700/80 z-20">
                <button
                  type="button"
                  onClick={() => {
                    setShowBgMenu(false);
                    bgInputRef.current?.click();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-2xl"
                >
                  Выбрать фото для фона
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBgMenu(false);
                    handleClearBackground();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-b-2xl"
                >
                  Очистить фон
                </button>
              </div>
            )}
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundUpload}
            />
          </div>
          {otherMember && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={async () => {
                  if (!otherMember?.id) return;
                  await startCall(otherMember.id, 'audio');
                }}
                className="rounded-full p-2.5 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Голосовой звонок"
              >
                📞
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={async () => {
                  if (!otherMember?.id) return;
                  await startCall(otherMember.id, 'video');
                }}
                className="rounded-full p-2.5 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Видеозвонок"
              >
                📹
              </motion.button>
            </>
          )}
        </div>
      </header>

      {pendingFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-28 left-3 right-3 z-10 p-4 rounded-3xl border border-white/20 dark:border-slate-600/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-lg"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Предпросмотр</p>
          <div className="flex gap-3 items-start">
            {pendingFile.file.type.startsWith('image/') && (
              <img src={pendingFile.previewUrl} alt="" className="w-20 h-20 object-cover rounded-2xl" />
            )}
            {pendingFile.file.type.startsWith('video/') && (
              <video src={pendingFile.previewUrl} className="w-32 h-20 object-cover rounded-2xl" controls />
            )}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={fileCaption}
                onChange={(e) => setFileCaption(e.target.value)}
                placeholder="Подпись к файлу..."
                className="w-full rounded-full border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 px-4 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendPendingFile(e);
                  }}
                  disabled={sending}
                  className="rounded-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {sending ? 'Отправка...' : 'Отправить'}
                </button>
                <button type="button" onClick={cancelPendingFile} className="rounded-full border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {replyTo && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-28 left-3 right-3 z-10 px-4 py-3 rounded-3xl border border-white/20 dark:border-slate-600/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ответ на</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 truncate font-medium">
              {replyTo.content?.slice(0, 50) || '—'}
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button" 
            onClick={() => setReplyTo(null)} 
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl transition-colors"
          >
            ✕
          </motion.button>
        </motion.div>
      )}

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={scrollToBottom}
            type="button"
            className="absolute bottom-32 right-4 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all"
            title="Прокрутить вниз"
          >
            <span className="text-xl">↓</span>
          </motion.button>
        )}
      </AnimatePresence>

      <form
        onSubmit={(e) => sendMessage(e)}
        className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 z-10 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full border border-white/20 dark:border-slate-600/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg"
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
            e.target.value = '';
          }} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2.5 sm:p-3 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shadow-sm hover:shadow flex-shrink-0"
            title="Файл"
          >
            📎
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onPointerDown={handleRecordPointerDown}
            onPointerUp={handleRecordPointerUp}
            onPointerLeave={handleRecordPointerLeave}
            className={`rounded-full p-2.5 sm:p-3 border border-slate-200 dark:border-slate-600 transition-all shadow-sm hover:shadow flex-shrink-0 ${
              recording
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white border-transparent'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title={
              recording
                ? 'Идет запись — удерживайте и отпустите, чтобы остановить'
                : recordMode === 'voice'
                  ? 'Голосовое / видеокружок — короткое нажатие меняет режим, удержание записывает'
                  : 'Видеокружок / голосовое — короткое нажатие меняет режим, удержание записывает'
            }
          >
            {recording ? '⏺' : recordMode === 'voice' ? '🎤' : '📹'}
          </motion.button>
          <div className="flex-1 min-w-0 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Сообщение..."
              className="w-full rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 pr-9 pl-3.5 sm:pl-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-0 dark:focus:ring-blue-400/60 shadow-sm transition-all"
              disabled={sending}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setStickerPickerOpen(true)}
              className="absolute inset-y-0 right-1.5 flex items-center justify-center rounded-full text-lg text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100"
              title="Стикеры"
            >
              😀
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: input.trim() && !sending ? 1.05 : 1 }}
            whileTap={{ scale: input.trim() && !sending ? 0.95 : 1 }}
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 flex-shrink-0"
          >
            ↑
          </motion.button>
        </div>
        {dragOver && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400 mt-3 flex items-center justify-center gap-2"
          >
            📥 Отпустите файл для отправки
          </motion.p>
        )}
      </form>

      <AnimatePresence>
        {stickerPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setStickerPickerOpen(false); setSelectedStickerPackId(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 max-h-[70vh] overflow-y-auto glass-effect border border-white/20 dark:border-slate-700/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Выбери стикер</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => { setStickerPickerOpen(false); setSelectedStickerPackId(null); }}
                  className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </motion.button>
              </div>
              {myStickerPacks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Нет стикерпаков</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Добавьте публичные паки в настройках</p>
                </div>
              ) : (
                <>
                  {!selectedStickerPackId ? (
                    <motion.div className="space-y-2">
                      {(myStickerPacks as Array<{ stickerPack: { id: string; name: string } }>).map(({ stickerPack }, idx) => (
                        <motion.button
                          key={stickerPack.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ x: 4 }}
                          type="button"
                          onClick={() => setSelectedStickerPackId(stickerPack.id)}
                          className="w-full rounded-2xl p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 font-semibold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-between group"
                        >
                          <span>{stickerPack.name}</span>
                          <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <>
                      <motion.button 
                        type="button" 
                        onClick={() => setSelectedStickerPackId(null)} 
                        className="text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-1"
                      >
                        ← Назад
                      </motion.button>
                      <div className="grid grid-cols-3 gap-3">
                        {packStickers.map((s, idx) => (
                          <motion.button
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={async () => {
                              if (!chatId || !selectedStickerPackId) return;
                              await messagesApi.send(chatId, s.url, {
                                type: 'sticker',
                                metadata: { stickerPackId: selectedStickerPackId, stickerId: s.id },
                              });
                              setStickerPickerOpen(false);
                              setSelectedStickerPackId(null);
                              queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
                              queryClient.invalidateQueries({ queryKey: ['chats'] });
                            }}
                            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all shadow-sm hover:shadow"
                          >
                            <img src={s.url} alt={s.emoji || ''} className="w-16 h-16 object-contain" />
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {forwardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setForwardModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[70vh] overflow-y-auto glass-effect border border-white/20 dark:border-slate-700/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Переслать</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setForwardModal(null)}
                  className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </motion.button>
              </div>
              <div className="space-y-2">
                {chatsList
                  .filter((c) => c.id !== chatId)
                  .map((c, idx) => (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 4 }}
                      type="button"
                      onClick={() => handleForward(c.id)}
                      className="w-full flex items-center gap-3 rounded-2xl p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 shadow-sm">
                        {(c.name || 'Чат').slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{c.name || 'Чат'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.type === 'private' ? 'Личный чат' : 'Групповой чат'}
                        </p>
                      </div>
                      <span className="text-lg text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors">→</span>
                    </motion.button>
                  ))}
              </div>
              {chatsList.filter((c) => c.id !== chatId).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Нет других чатов</p>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setForwardModal(null)}
                className="mt-4 w-full rounded-2xl py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all"
              >
                Отмена
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка: стикерпак по клику на стикер */}
      <AnimatePresence>
        {stickerPackModalPackId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setStickerPackModalPackId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-600 p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {stickerPackModalData?.name ?? 'Стикерпак'}
                </h3>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setStickerPackModalPackId(null)}
                  className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </motion.button>
              </div>
              {stickerPackModalLoading && (
                <p className="text-sm text-slate-500 dark:text-slate-400">Загрузка стикерпака...</p>
              )}
              {stickerPackModalIsError && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Не удалось загрузить стикерпак.
                </p>
              )}
              {stickerPackModalData && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {stickerPackModalData.stickers?.map((s) => (
                      <img key={s.id} src={s.url} alt="" className="w-full aspect-square object-contain" />
                    ))}
                  </div>
                  {!stickerPackModalData.isAdded && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          await stickersApi.addPack(stickerPackModalPackId);
                          queryClient.invalidateQueries({ queryKey: ['stickers', 'my-packs'] });
                          queryClient.invalidateQueries({ queryKey: ['stickers', 'pack-info', stickerPackModalPackId] });
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full rounded-2xl bg-blue-500 text-white py-3 font-semibold"
                    >
                      Добавить стикерпак
                    </motion.button>
                  )}
                  {stickerPackModalData.isAdded && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Стикерпак уже добавлен</p>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

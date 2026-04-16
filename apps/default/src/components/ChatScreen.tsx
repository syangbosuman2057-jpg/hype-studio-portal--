import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Phone, Video, Send, Smile, Image,
  Mic, MoreVertical, CheckCheck, Check, Clock, Trash2,
  Heart, ThumbsUp, Laugh, Zap, X, MicOff, VideoOff,
  Speaker, SwitchCamera, PhoneOff, PhoneCall, Volume2,
  ChevronRight, Info, Star, ShoppingBag, Package,
} from 'lucide-react';
import { useChatStore, type ChatMessage, type Contact } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMOJI_QUICK = ['❤️', '😂', '😮', '😢', '😡', '👍', '🙏', '🔥'];
const EMOJI_GRID = [
  '😀','😂','🥰','😍','🤩','😎','🥺','😢',
  '😡','🤯','🥳','😴','🤔','🙄','😮','🤭',
  '👍','👎','🙏','❤️','🔥','⭐','💯','🎉',
  '🛍️','📦','💰','🇳🇵','🏔️','🌸','✅','❌',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7)  return `${d}d`;
  return new Date(ts).toLocaleDateString();
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function lastSeenText(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return 'yesterday';
}

// ─── Status tick icons ─────────────────────────────────────────────────────────
function MsgTicks({ status }: { status: ChatMessage['status'] }) {
  if (status === 'sending')   return <Clock className="w-3 h-3 text-zinc-500" />;
  if (status === 'sent')      return <Check className="w-3 h-3 text-zinc-400" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-zinc-400" />;
  return <CheckCheck className="w-3 h-3 text-blue-400" />;
}

// ─── CALL SCREEN ──────────────────────────────────────────────────────────────
type CallType = 'audio' | 'video';
interface CallScreenProps {
  contact: Contact;
  type: CallType;
  onEnd: () => void;
}

function CallScreen({ contact, type, onEnd }: CallScreenProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [muted, setMuted]         = useState(false);
  const [speakerOn, setSpeakerOn] = useState(type === 'video');
  const [camOff, setCamOff]       = useState(false);
  const [duration, setDuration]   = useState(0);
  const [frontCam, setFrontCam]   = useState(true);

  useEffect(() => {
    // Simulate the other person picking up
    const t = setTimeout(() => setCallState('connected'), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (callState !== 'connected') return;
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ maxWidth: 448, margin: '0 auto' }}
    >
      {/* Background */}
      {type === 'video' && callState === 'connected' ? (
        /* Simulated video background */
        <div className="absolute inset-0 bg-zinc-900">
          <img
            src={`https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80`}
            className={cn('w-full h-full object-cover', camOff && 'opacity-0')}
            alt="Video feed"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ) : (
        /* Audio call background */
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
      )}

      {/* Self-view (video only) */}
      {type === 'video' && callState === 'connected' && (
        <motion.div
          drag
          dragConstraints={{ top: 0, right: 0, bottom: 300, left: -250 }}
          className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden z-10 border-2 border-white/20 shadow-xl cursor-move"
        >
          <img
            src={`https://api.dicebear.com/8.x/avataaars/svg?seed=selfview`}
            className={cn('w-full h-full object-cover bg-zinc-800', camOff && 'opacity-0')}
          />
          {camOff && (
            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-zinc-500" />
            </div>
          )}
        </motion.div>
      )}

      {/* Top info */}
      <div className="relative z-10 flex flex-col items-center pt-20 pb-6">
        {/* Avatar */}
        <div className="relative mb-4">
          <img
            src={contact.avatar}
            className="w-28 h-28 rounded-full border-4 border-white/20 shadow-2xl bg-zinc-800"
          />
          {callState === 'ringing' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full border-4 border-green-400"
              />
              <motion.div
                animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                className="absolute inset-0 rounded-full border-4 border-green-400"
              />
            </>
          )}
        </div>

        <h2 className="text-white font-black text-2xl">{contact.displayName}</h2>
        <p className="text-zinc-300 text-sm mt-1">@{contact.username}</p>

        <div className="mt-3 flex items-center gap-2">
          {callState === 'ringing' ? (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-sm font-semibold">
                {type === 'video' ? '📹 Video' : '📞 Audio'} call ringing…
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-300 text-sm font-bold">{fmt(duration)}</span>
            </>
          )}
        </div>

        {callState === 'ringing' && (
          <p className="text-zinc-400 text-xs mt-1">Waiting for {contact.displayName} to answer…</p>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Call controls */}
      <div className="relative z-10 pb-16 px-8">
        <div className="flex items-center justify-center gap-5 mb-5">
          {/* Mute */}
          <button onClick={() => { setMuted(!muted); toast(muted ? 'Mic on 🎤' : 'Mic muted 🔇'); }}
            className={cn(
              'w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all',
              muted ? 'bg-white text-black' : 'bg-white/15 text-white'
            )}>
            {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            <span className="text-[10px] font-semibold">{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Speaker */}
          <button onClick={() => { setSpeakerOn(!speakerOn); toast(speakerOn ? 'Speaker off' : 'Speaker on 🔊'); }}
            className={cn(
              'w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all',
              speakerOn ? 'bg-white text-black' : 'bg-white/15 text-white'
            )}>
            <Volume2 className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Speaker</span>
          </button>

          {/* Camera toggle (video only) */}
          {type === 'video' && (
            <button onClick={() => { setCamOff(!camOff); toast(camOff ? 'Camera on 📹' : 'Camera off'); }}
              className={cn(
                'w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all',
                camOff ? 'bg-white text-black' : 'bg-white/15 text-white'
              )}>
              {camOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              <span className="text-[10px] font-semibold">Camera</span>
            </button>
          )}

          {/* Flip camera (video only) */}
          {type === 'video' && (
            <button onClick={() => { setFrontCam(!frontCam); toast('Camera flipped 🔄'); }}
              className="w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 bg-white/15 text-white transition-all">
              <SwitchCamera className="w-6 h-6" />
              <span className="text-[10px] font-semibold">Flip</span>
            </button>
          )}
        </div>

        {/* End call */}
        <div className="flex items-center justify-center">
          <button
            onClick={onEnd}
            className="w-20 h-20 bg-red-500 rounded-full flex flex-col items-center justify-center shadow-2xl shadow-red-500/50 active:scale-90 transition-transform"
          >
            <PhoneOff className="w-8 h-8 text-white" />
            <span className="text-white text-[10px] font-bold mt-0.5">End</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── EMOJI PICKER ─────────────────────────────────────────────────────────────
function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      className="absolute bottom-full left-0 mb-2 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 z-30 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-zinc-400 text-xs font-semibold">Emoji</p>
        <button onClick={onClose}><X className="w-4 h-4 text-zinc-500" /></button>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {EMOJI_GRID.map(e => (
          <button key={e} onClick={() => { onPick(e); onClose(); }}
            className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors">
            {e}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── REACTION POPUP ────────────────────────────────────────────────────────────
function ReactionBar({ onReact, onClose }: { onReact: (e: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 4 }}
      className="absolute -top-12 left-0 flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-2 shadow-xl z-20"
    >
      {EMOJI_QUICK.map(e => (
        <button key={e} onClick={() => { onReact(e); onClose(); }}
          className="text-xl active:scale-75 transition-transform">
          {e}
        </button>
      ))}
    </motion.div>
  );
}

// ─── BUBBLE ────────────────────────────────────────────────────────────────────
function Bubble({
  msg, isMe, partnerAvatar, myUser, onReact, onDelete,
}: {
  msg: ChatMessage;
  isMe: boolean;
  partnerAvatar: string;
  myUser: string;
  onReact: (msgId: string, emoji: string) => void;
  onDelete: (msgId: string) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handlePressStart = () => {
    const t = setTimeout(() => setShowReactions(true), 500);
    setLongPressTimer(t);
  };
  const handlePressEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  const groupedReactions = msg.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={cn('flex items-end gap-2 group', isMe ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isMe && (
        <img src={partnerAvatar} className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0 mb-1" />
      )}

      <div className="relative max-w-[72%]">
        {/* Reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowReactions(false)} />
              <div className={cn('absolute z-20 -top-12', isMe ? 'right-0' : 'left-0')}>
                <ReactionBar
                  onReact={e => onReact(msg.id, e)}
                  onClose={() => setShowReactions(false)}
                />
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Bubble */}
        <div
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          className={cn(
            'relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed select-none cursor-pointer',
            isMe
              ? 'bg-red-500 text-white rounded-br-sm'
              : 'bg-zinc-800 text-white rounded-bl-sm',
            msg.deleted && 'opacity-60 italic'
          )}
        >
          {/* Type badge */}
          {msg.type === 'order' && !msg.deleted && (
            <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
              <Package className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Order Update</span>
            </div>
          )}
          {msg.type === 'product' && !msg.deleted && (
            <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Product</span>
            </div>
          )}

          <p>{msg.text}</p>

          {/* Time + status row */}
          <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
            <span className="text-[10px] opacity-60">{formatTime(msg.timestamp)}</span>
            {isMe && <MsgTicks status={msg.status} />}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={cn('flex gap-1 mt-1 flex-wrap', isMe ? 'justify-end' : 'justify-start')}>
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className="flex items-center gap-0.5 bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 text-xs"
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-zinc-300 font-bold">{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Delete option (own messages) */}
        {isMe && !msg.deleted && (
          <button
            onClick={() => onDelete(msg.id)}
            className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-400 transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
function TypingIndicator({ avatar }: { avatar: string }) {
  return (
    <div className="flex items-end gap-2">
      <img src={avatar} className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0" />
      <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            className="w-2 h-2 bg-zinc-400 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

// ─── CHAT CONVERSATION VIEW ────────────────────────────────────────────────────
function ConversationView({
  contact, myUser, onBack, onCall,
}: {
  contact: Contact;
  myUser: string;
  onBack: () => void;
  onCall: (type: CallType) => void;
}) {
  const { getConversation, sendMessage, simulateReply, addReaction, deleteMessage, markRead, typingUsers } = useChatStore();
  const [text, setText]         = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMore, setShowMore]  = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs]   = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const messages  = getConversation(myUser, contact.username);
  const isTyping  = typingUsers[contact.username] ?? false;

  // Mark messages as read when entering
  useEffect(() => {
    markRead(contact.username, myUser);
  }, [contact.username]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  // Recording timer
  useEffect(() => {
    if (!recording) { setRecSecs(0); return; }
    const t = setInterval(() => setRecSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  function handleSend(customText?: string) {
    const msg = (customText ?? text).trim();
    if (!msg) return;
    setText('');
    sendMessage(myUser, contact.username, msg);
    // Simulate reply if contact is online
    if (contact.online) {
      simulateReply(contact.username, myUser, 1500 + Math.random() * 2000);
    }
  }

  function handleVoiceNote() {
    if (recording) {
      setRecording(false);
      const dur = recSecs;
      sendMessage(myUser, contact.username, `🎙️ Voice message (${dur}s)`, 'voice');
      if (contact.online) simulateReply(contact.username, myUser, 2000);
      toast.success(`Voice note sent (${dur}s)`);
    } else {
      setRecording(true);
      toast('Recording… tap again to send 🎙️', { duration: 999999, id: 'rec' });
    }
  }

  function stopRecording() {
    toast.dismiss('rec');
    setRecording(false);
    setRecSecs(0);
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      sendMessage(myUser, contact.username, `📷 Sent a photo`, 'image');
      if (contact.online) simulateReply(contact.username, myUser, 1800);
      toast.success('Photo sent!');
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-900/60 flex-shrink-0">
        <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors active:scale-90">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => toast(`@${contact.username} profile coming soon`)}>
          <div className="relative">
            <img src={contact.avatar} className="w-10 h-10 rounded-full bg-zinc-800" />
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-950" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-sm truncate">{contact.displayName}</p>
              {contact.verified && <span className="text-blue-400 text-xs">✓</span>}
            </div>
            <p className={cn('text-xs', contact.online ? 'text-green-400' : 'text-zinc-500')}>
              {isTyping ? (
                <span className="text-green-400 animate-pulse">typing…</span>
              ) : contact.online ? (
                'Online'
              ) : (
                `Last seen ${lastSeenText(contact.lastSeen)}`
              )}
            </p>
          </div>
        </button>

        {/* Call buttons */}
        <button onClick={() => onCall('audio')}
          className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all active:scale-90">
          <Phone className="w-5 h-5" />
        </button>
        <button onClick={() => onCall('video')}
          className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all active:scale-90">
          <Video className="w-5 h-5" />
        </button>
        <button onClick={() => setShowMore(!showMore)}
          className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl transition-all">
          <MoreVertical className="w-5 h-5" />
        </button>

        {/* More menu */}
        <AnimatePresence>
          {showMore && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute top-full right-4 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl z-20 w-48"
              >
                {[
                  { icon: <Star className="w-4 h-4" />, label: 'Star messages' },
                  { icon: <Info className="w-4 h-4" />, label: 'Contact info' },
                  { icon: <ShoppingBag className="w-4 h-4" />, label: 'View shop' },
                  { icon: <Trash2 className="w-4 h-4 text-red-400" />, label: 'Clear chat', cls: 'text-red-400' },
                ].map(item => (
                  <button key={item.label} onClick={() => { setShowMore(false); toast(item.label); }}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-sm text-zinc-200', item.cls)}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-3 pb-28">
        {/* Date divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs">Today</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
              <img src={contact.avatar} className="w-12 h-12 rounded-full" />
            </div>
            <p className="text-white font-bold">{contact.displayName}</p>
            <p className="text-zinc-500 text-sm text-center">Say hello to @{contact.username}! 👋</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {['👋 Hello!', '🛍️ I want to order', '📦 Order status?', '💰 Price?'].map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-xs text-zinc-300 hover:border-red-500/50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <motion.div key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}>
            <Bubble
              msg={msg}
              isMe={msg.from === myUser}
              partnerAvatar={contact.avatar}
              myUser={myUser}
              onReact={(id, emoji) => addReaction(id, emoji, myUser)}
              onDelete={deleteMessage}
            />
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}>
              <TypingIndicator avatar={contact.avatar} />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 bg-zinc-950 border-t border-zinc-900/60 px-3 py-3 pb-24">
        {/* Recording indicator */}
        <AnimatePresence>
          {recording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 mb-2 px-2"
            >
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-bold">Recording {recSecs}s</span>
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(recSecs * 2, 100)}%` }} />
              </div>
              <button onClick={stopRecording} className="text-zinc-500 hover:text-red-400"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Emoji */}
          <div className="relative">
            <button onClick={() => setShowEmoji(!showEmoji)}
              className={cn('w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
                showEmoji ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-500 hover:text-zinc-300')}>
              <Smile className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker onPick={e => setText(t => t + e)} onClose={() => setShowEmoji(false)} />
              )}
            </AnimatePresence>
          </div>

          {/* Text input */}
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={`Message @${contact.username}…`}
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-red-500/50 text-white placeholder-zinc-600 rounded-2xl px-4 py-2.5 text-sm outline-none transition-colors"
          />

          {/* Image attach */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          {!text && (
            <button onClick={() => fileRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-zinc-300 rounded-xl transition-colors">
              <Image className="w-5 h-5" />
            </button>
          )}

          {/* Send or voice */}
          {text ? (
            <button onClick={() => handleSend()}
              className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/25 active:scale-90 transition-all">
              <Send className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button onClick={handleVoiceNote}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90',
                recording ? 'bg-red-500 animate-pulse shadow-red-500/40' : 'bg-zinc-800'
              )}>
              <Mic className={cn('w-5 h-5', recording ? 'text-white' : 'text-zinc-400')} />
            </button>
          )}
        </div>

        {/* Quick replies */}
        {messages.length === 0 && !text && (
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-none">
            {['👋', '🙏 Namaste!', '📦 Order status?', '💰 Best price?'].map(s => (
              <button key={s} onClick={() => handleSend(s)}
                className="flex-shrink-0 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 hover:border-red-500/40 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONVERSATION LIST ────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { user }       = useAuthStore();
  const myUser         = user?.username ?? 'guest';
  const { initForUser, getContacts, getLastMessage, getUnreadCount, updateOnlineStatus } = useChatStore();

  const [search, setSearch]     = useState('');
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [callTarget, setCallTarget]       = useState<{ contact: Contact; type: CallType } | null>(null);

  useEffect(() => { initForUser(myUser); }, [myUser]);

  // Simulate online status changes every 30s
  useEffect(() => {
    const t = setInterval(updateOnlineStatus, 30_000);
    return () => clearInterval(t);
  }, []);

  const contacts = getContacts().filter(c =>
    c.username !== myUser &&
    (c.displayName.toLowerCase().includes(search.toLowerCase()) ||
     c.username.toLowerCase().includes(search.toLowerCase()))
  );

  const totalUnread = getUnreadCount(myUser);

  function handleCall(contact: Contact, type: CallType) {
    setCallTarget({ contact, type });
    toast(`Starting ${type} call with ${contact.displayName}…`, { duration: 1500 });
  }

  // ── Active conversation ────────────────────────────────────────────────────
  if (activeContact) {
    return (
      <>
        <AnimatePresence>
          {callTarget && (
            <CallScreen
              contact={callTarget.contact}
              type={callTarget.type}
              onEnd={() => {
                setCallTarget(null);
                toast('Call ended');
              }}
            />
          )}
        </AnimatePresence>

        <ConversationView
          contact={activeContact}
          myUser={myUser}
          onBack={() => setActiveContact(null)}
          onCall={type => handleCall(activeContact, type)}
        />
      </>
    );
  }

  // ── Inbox list ─────────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 bg-zinc-950 flex flex-col">

      {/* Header */}
      <div className="px-4 pt-14 pb-3 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-black text-2xl">Messages</h1>
            {totalUnread > 0 && (
              <p className="text-red-400 text-xs font-semibold">{totalUnread} unread</p>
            )}
          </div>
          <button className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-90 transition-transform">
            <span className="text-base">✏️</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 focus-within:border-red-500/40 rounded-2xl px-4 py-2.5 transition-colors">
          <Search className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm outline-none"
          />
        </div>
      </div>

      {/* Online now strip */}
      <div className="px-4 mb-2 flex-shrink-0">
        <p className="text-zinc-500 text-xs font-semibold mb-2">ONLINE NOW</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {contacts.filter(c => c.online).map(c => (
            <button key={c.username} onClick={() => setActiveContact(c)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-90 transition-transform">
              <div className="relative">
                <img src={c.avatar} className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-green-400" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-zinc-950" />
              </div>
              <span className="text-zinc-400 text-[10px] font-semibold max-w-[56px] truncate">{c.displayName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-28">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-white font-bold">No conversations yet</p>
            <p className="text-zinc-500 text-sm">Message sellers from the Shop tab</p>
          </div>
        ) : (
          contacts.map(contact => {
            const last    = getLastMessage(myUser, contact.username);
            const unread  = useChatStore.getState().messages.filter(
              m => m.from === contact.username && m.to === myUser && m.status !== 'read'
            ).length;

            return (
              <motion.button
                key={contact.username}
                onClick={() => setActiveContact(contact)}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img src={contact.avatar} className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-zinc-800" />
                  {contact.online && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-950" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className={cn('font-bold text-sm truncate', unread > 0 ? 'text-white' : 'text-zinc-200')}>
                      {contact.displayName}
                    </p>
                    {contact.verified && <span className="text-blue-400 text-xs">✓</span>}
                    {contact.role === 'seller' && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">SELLER</span>
                    )}
                  </div>
                  <p className={cn('text-xs truncate', unread > 0 ? 'text-zinc-200 font-semibold' : 'text-zinc-500')}>
                    {useChatStore.getState().typingUsers[contact.username]
                      ? '✍️ typing…'
                      : last ? last.text : 'Start a conversation'
                    }
                  </p>
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-zinc-600 text-[10px]">{last ? timeAgo(last.timestamp) : ''}</span>
                  {unread > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleCall(contact, 'audio'); }}
                    className="text-zinc-700 hover:text-green-400 transition-colors active:scale-75">
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

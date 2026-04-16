import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifStore, type NotifType } from '../store/notifStore';
import { cn } from '../lib/utils';

const TYPE_COLORS: Record<NotifType, string> = {
  order:    'bg-blue-500/20 border-blue-500/30',
  follow:   'bg-purple-500/20 border-purple-500/30',
  like:     'bg-red-500/20 border-red-500/30',
  coin:     'bg-yellow-500/20 border-yellow-500/30',
  badge:    'bg-orange-500/20 border-orange-500/30',
  live:     'bg-red-500/20 border-red-500/30',
  review:   'bg-green-500/20 border-green-500/30',
  delivery: 'bg-indigo-500/20 border-indigo-500/30',
};

export default function NotificationsScreen() {
  const { notifs, unreadCount, markAllRead, markRead, clearAll } = useNotifStore();

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = diff / 60000 | 0;
    const hrs  = diff / 3600000 | 0;
    const days = diff / 86400000 | 0;
    if (mins < 60)  return `${mins}m ago`;
    if (hrs < 24)   return `${hrs}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" />
            <h1 className="text-white font-bold text-xl">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-zinc-500 hover:text-white text-xs transition-colors flex items-center gap-1">
                <Check className="w-4 h-4" /> Mark all read
              </button>
            )}
            <button onClick={clearAll} className="text-zinc-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">No notifications</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="py-2">
            <AnimatePresence>
              {notifs.map((notif, i) => (
                <motion.button
                  key={notif.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    'w-full flex items-start gap-4 px-4 py-4 border-b border-zinc-900 text-left transition-colors',
                    !notif.read ? 'bg-zinc-900/60' : 'hover:bg-zinc-900/30'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border',
                    TYPE_COLORS[notif.type]
                  )}>
                    {notif.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn('font-bold text-sm', notif.read ? 'text-zinc-300' : 'text-white')}>{notif.title}</p>
                      <span className="text-zinc-600 text-xs flex-shrink-0 ml-2">{timeAgo(notif.timestamp)}</span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{notif.body}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

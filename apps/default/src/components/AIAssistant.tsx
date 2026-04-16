import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Minimize2 } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { createConversation, createAgentChat } from '@/lib/agent-chat/v2';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { isToolUIPart } from 'ai';
import type { UIMessage } from 'ai';
import { ulid } from 'ulidx';
import { AGENT_ID } from '../lib/api';

type Chat = ReturnType<typeof createAgentChat>;

const SUGGESTIONS = [
  'What products are popular? 🔥',
  'Find fashion sellers near me',
  'How do I become a seller?',
  'Track my order status',
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [starting, setStarting] = useState(false);

  async function handleOpen() {
    setOpen(true);
    if (!chat) {
      setStarting(true);
      try {
        const { conversationId } = await createConversation(AGENT_ID);
        setChat(createAgentChat(AGENT_ID, conversationId));
      } catch {
        console.error('Failed to create conversation');
      } finally {
        setStarting(false);
      }
    }
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-red-500 hover:bg-red-400 rounded-full shadow-2xl shadow-red-500/50 flex items-center justify-center transition-colors"
          >
            <span className="text-2xl">🇳🇵</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-24 right-4 left-4 z-50 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '75vh', height: '75vh' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
              <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center text-lg">🇳🇵</div>
              <div>
                <p className="text-white font-bold text-sm">Nepalese Hype Assistant</p>
                <p className="text-green-400 text-xs">● Online</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <Minimize2 className="w-5 h-5" />
                </button>
                <button onClick={() => { setOpen(false); }} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {starting ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2 animate-bounce">🇳🇵</div>
                  <p className="text-zinc-400 text-sm">Starting assistant...</p>
                </div>
              </div>
            ) : chat ? (
              <ActiveChat chat={chat} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-zinc-500 text-sm text-center">Failed to connect. Please try again.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ActiveChat({ chat }: { chat: Chat }) {
  const { messages, status, addToolApprovalResponse } = useChat({ chat, id: chat.id });
  const isSending = status === 'submitted' || status === 'streaming';
  const hasMessages = messages.length > 0;

  async function handleSend(text: string) {
    await chat.sendMessage({
      id: ulid(),
      role: 'user',
      parts: [{ type: 'text', text }],
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {!hasMessages && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-zinc-400 text-xs text-center mb-2">
            Namaste! 🙏 How can I help you today?
          </p>
        </div>
      )}

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent>
                <MessageParts message={msg} onApprove={addToolApprovalResponse} />
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {!hasMessages && (
        <Suggestions className="px-2 py-2">
          {SUGGESTIONS.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={handleSend} />
          ))}
        </Suggestions>
      )}

      <PromptInput onSubmit={({ text }) => handleSend(text)} className="border-t border-zinc-800 rounded-none">
        <PromptInputTextarea placeholder="Ask me anything about Nepalese Hype..." />
        <PromptInputFooter>
          <PromptInputSubmit status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function MessageParts({
  message,
  onApprove,
}: {
  message: UIMessage;
  onApprove: ReturnType<typeof useChat>['addToolApprovalResponse'];
}) {
  return (
    <>
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;
        if (part.type === 'text') {
          return message.role === 'user' ? (
            <p key={key} className="text-sm">{part.text}</p>
          ) : (
            <MessageResponse key={key}>{part.text}</MessageResponse>
          );
        }
        if (isToolUIPart(part)) {
          return (
            <div key={key} className="text-xs text-zinc-500 italic py-1">
              🔧 {part.toolName} [{part.state}]
            </div>
          );
        }
        return null;
      })}
    </>
  );
}

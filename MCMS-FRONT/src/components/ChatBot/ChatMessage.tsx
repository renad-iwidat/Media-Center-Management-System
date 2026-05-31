import React from 'react';
import { ChatMessage as ChatMessageType } from '../../services/chatbot';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white rounded-bl-lg'
            : 'bg-gray-200 text-gray-900 rounded-br-lg'
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-600'
          }`}
        >
          {format(new Date(message.timestamp), 'HH:mm', { locale: ar })}
        </p>
      </div>
    </motion.div>
  );
}

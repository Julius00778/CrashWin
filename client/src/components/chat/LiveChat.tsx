import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
  type?: 'message' | 'bet' | 'win' | 'tip';
  amount?: number;
  multiplier?: number;
}

interface LiveChatProps {
  socket: WebSocket | null;
}

const emojis = ['😀', '😂', '😍', '🤩', '😎', '🔥', '💎', '🚀', '💰', '🎉', '👏', '💪', '🤑', '😱'];

export default function LiveChat({ socket }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Add system messages for game events
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'chatMessage':
          setMessages(prev => [...prev.slice(-49), {
            id: data.id || Date.now().toString(),
            username: data.username,
            avatar: data.avatar,
            message: data.message,
            timestamp: new Date(data.timestamp || Date.now()),
            type: 'message'
          }]);
          break;
          
        case 'betPlaced':
          setMessages(prev => [...prev.slice(-49), {
            id: `bet-${Date.now()}`,
            username: 'System',
            message: `${data.username} placed a bet of ₹${data.amount.toFixed(2)}`,
            timestamp: new Date(),
            isSystem: true,
            type: 'bet',
            amount: data.amount
          }]);
          break;
          
        case 'betCashedOut':
          const winAmount = data.amount * data.multiplier;
          setMessages(prev => [...prev.slice(-49), {
            id: `win-${Date.now()}`,
            username: 'System',
            message: `${data.username} cashed out at ${data.multiplier.toFixed(2)}x and won ₹${winAmount.toFixed(2)}!`,
            timestamp: new Date(),
            isSystem: true,
            type: 'win',
            amount: winAmount,
            multiplier: data.multiplier
          }]);
          break;
          
        case 'onlineUsers':
          setOnlineUsers(data.users);
          break;
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add demo messages on load
  useEffect(() => {
    const demoMessages: ChatMessage[] = [
      {
        id: '1',
        username: 'CryptoKing',
        message: 'Just won big on 10.5x! 🚀💰',
        timestamp: new Date(Date.now() - 180000),
        type: 'message'
      },
      {
        id: '2',
        username: 'System',
        message: 'LuckyPlayer cashed out at 3.24x and won ₹1,620.00!',
        timestamp: new Date(Date.now() - 120000),
        isSystem: true,
        type: 'win',
        amount: 1620,
        multiplier: 3.24
      },
      {
        id: '3',
        username: 'DiamondHands',
        message: 'Anyone else feeling lucky today? 💎',
        timestamp: new Date(Date.now() - 60000),
        type: 'message'
      }
    ];
    setMessages(demoMessages);
  }, []);

  const handleSendMessage = () => {
    if (!socket || !newMessage.trim() || !user) return;

    const message = {
      type: 'chatMessage',
      message: newMessage.trim(),
      username: user.email?.split('@')[0] || 'Player',
      timestamp: Date.now()
    };

    socket.send(JSON.stringify(message));

    // Add message immediately to UI for responsiveness
    setMessages(prev => [...prev.slice(-49), {
      id: Date.now().toString(),
      username: message.username,
      message: message.message,
      timestamp: new Date(message.timestamp),
      type: 'message'
    }]);

    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getMessageIcon = (type?: string) => {
    switch(type) {
      case 'bet': return '🎯';
      case 'win': return '🎉';
      case 'tip': return '💝';
      default: return null;
    }
  };

  const getMessageColor = (type?: string) => {
    switch(type) {
      case 'bet': return 'text-blue-400';
      case 'win': return 'text-green-400';
      case 'tip': return 'text-purple-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="bg-secondary rounded-xl overflow-hidden shadow-lg" data-testid="live-chat">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-accent-green animate-pulse"></div>
            <h3 className="font-semibold text-white">Live Chat</h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-accent-green text-black px-2 py-1 rounded-full font-semibold">
              {onlineUsers.length || 247} online
            </span>
            <span className="text-xs text-gray-400">
              {messages.filter(m => !m.isSystem).length} messages
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-900/50" data-testid="chat-messages">
        {messages.map((message, index) => (
          <div key={message.id || index} className={`text-sm ${message.isSystem ? 'opacity-75' : ''}`}>
            {message.isSystem ? (
              <div className="flex items-center space-x-2 text-center justify-center">
                <span className="text-xs">{getMessageIcon(message.type)}</span>
                <span className={`text-xs ${getMessageColor(message.type)}`}>
                  {message.message}
                </span>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-gold to-accent-green flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                  {message.avatar || message.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="font-medium text-accent-gold text-sm">
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className="text-gray-200 break-words leading-relaxed">
                    {message.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        {!user ? (
          <div className="text-center py-3">
            <p className="text-gray-400 text-sm mb-2">Login to join the chat</p>
            <Button 
              className="bg-accent-gold hover:bg-yellow-500 text-black text-sm px-4 py-1"
              onClick={() => window.location.href = '/'}
            >
              Login
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message... (Enter to send)"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                  maxLength={200}
                  data-testid="chat-input"
                />
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-accent-gold transition-colors"
                >
                  😀
                </button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-accent-green hover:bg-green-600 text-black px-4 disabled:opacity-50"
                data-testid="send-message-button"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>

            {/* Character count */}
            <div className="text-xs text-gray-500 text-right">
              {newMessage.length}/200
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="grid grid-cols-7 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="text-lg hover:bg-gray-600 rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
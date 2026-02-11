import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import { io } from 'socket.io-client';
import { Send, User, MessageSquare, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Chat = () => {
  const { user, setUnreadMessages, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  // Reset global unread count when opening chat
  useEffect(() => {
    if (!authLoading && setUnreadMessages) {
      setUnreadMessages(0);
    }
  }, [setUnreadMessages, authLoading]);

  // Reset local unread count when selecting contact
  useEffect(() => {
    if (activeContact) {
      // Also update local unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [activeContact.id]: 0
      }));
    }
  }, [activeContact]);

  // Initialize Socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('https://others-tirvu-parceiros-frontend.pvuzyy.easypanel.host' || 'http://localhost:5000', {
      auth: { token }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Fetch Contacts
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await chatService.getContacts();
      setContacts(data);
      
      // Initialize unread counts from backend data
      const initialUnread = {};
      data.forEach(contact => {
        if (contact.unreadCount > 0) {
            initialUnread[contact.id] = contact.unreadCount;
        }
      });
      setUnreadCounts(prev => ({ ...prev, ...initialUnread }));
      
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Listen for incoming messages and status
  useEffect(() => {
    if (!socket) return;

    // Online Users
    socket.on('online_users_list', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('user_status_change', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    socket.on('receive_message', (message) => {
      // Move contact to top
      setContacts(prev => {
        const otherId = message.senderId === user.id ? message.receiverId : message.senderId;
        const index = prev.findIndex(c => c.id === otherId);
        if (index <= 0) return prev;
        
        const newContacts = [...prev];
        const [moved] = newContacts.splice(index, 1);
        newContacts.unshift(moved);
        return newContacts;
      });

      // Only append if we are chatting with the sender or if it's from me
      if (activeContact && (message.senderId === activeContact.id || message.receiverId === activeContact.id)) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      } else {
        // If message is from someone else and I'm not the sender, add notification
        if (message.senderId !== user.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.senderId]: (prev[message.senderId] || 0) + 1
          }));
        }
      }
    });

    return () => socket.off('receive_message');
  }, [socket, activeContact, user.id]);

  // Load messages when active contact changes
  useEffect(() => {
    if (activeContact) {
      loadMessages(activeContact.id);
      // Clear unread count when opening chat
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[activeContact.id];
        return newCounts;
      });
    }
  }, [activeContact]);

  const loadMessages = async (contactId) => {
    try {
      const data = await chatService.getMessages(contactId);
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact || !socket) return;

    // Emit to socket
    socket.emit('send_message', {
      receiverId: activeContact.id,
      content: newMessage
    });

    // Optimistically add to UI
    const tempMsg = {
      id: Date.now(), // Temp ID
      senderId: user.id, // My ID
      receiverId: activeContact.id,
      content: newMessage,
      createdAt: new Date().toISOString(),
      Sender: { id: user.id, name: user.name }
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');
    scrollToBottom();

    // Move active contact to top
    setContacts(prev => {
      const index = prev.findIndex(c => c.id === activeContact.id);
      if (index <= 0) return prev;
      const newContacts = [...prev];
      const [moved] = newContacts.splice(index, 1);
      newContacts.unshift(moved);
      return newContacts;
    });
  };

  // Helper functions for roles
  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'partner': return 'Parceiro';
      case 'consultor': return 'Consultor';
      default: return role;
    }
  };

  const getRoleStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'partner': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'consultor': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar / Contact List */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5" />
            Mensagens
          </h2>
          <div className="relative">
            <input
                type="text"
                placeholder="Pesquisar contato..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Nenhum contato encontrado.' : 'Nenhum contato disponível.'}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                  activeContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold shrink-0 relative">
                  {contact.name.charAt(0).toUpperCase()}
                  {unreadCounts[contact.id] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                      {unreadCounts[contact.id]}
                    </span>
                  )}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${onlineUsers.has(contact.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                </div>
                <div className="overflow-hidden flex flex-col items-start gap-1 flex-1">
                  <div className="flex justify-between items-center w-full">
                    <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                    {unreadCounts[contact.id] > 0 && (
                       <span className="text-[10px] text-green-600 font-medium">Nova msg</span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleStyle(contact.role)}`}>
                    {getRoleLabel(contact.role)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white shadow-sm z-10">
              <button 
                onClick={() => setActiveContact(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                Voltar
              </button>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold relative">
                {activeContact.name.charAt(0).toUpperCase()}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${onlineUsers.has(activeContact.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{activeContact.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleStyle(activeContact.role)}`}>
                  {getRoleLabel(activeContact.role)}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === (user.id || user.user.id); // Check structure of user object from context
                // Adjusting check: AuthContext user usually has `id` directly if decoded from token, or `user.id` if from login response.
                // Let's assume user.id based on AuthContext usage elsewhere.
                // Wait, checking Login.jsx or AuthContext.js... 
                // In Login.jsx: `setUser(data.user);` -> payload has `id`.
                
                return (
                  <div
                    key={index}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                        isMe
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm") : '...'}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>Selecione um contato para iniciar uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import { io } from 'socket.io-client';
import { Send, User, MessageSquare, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Chat = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

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
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (message) => {
      // Only append if we are chatting with the sender or if it's from me (shouldn't happen via this event usually but good safety)
      // OR if we want to show unread badges later, we'd handle that here.
      
      if (activeContact && (message.senderId === activeContact.id || message.receiverId === activeContact.id)) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    return () => socket.off('receive_message');
  }, [socket, activeContact]);

  // Load messages when active contact changes
  useEffect(() => {
    if (activeContact) {
      loadMessages(activeContact.id);
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
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{contact.role}</p>
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
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{activeContact.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{activeContact.role}</p>
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

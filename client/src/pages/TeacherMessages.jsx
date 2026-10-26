import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherConversations,
  getTeacherMessageContacts,
  createTeacherConversation,
  getTeacherMessages,
  sendTeacherMessage,
  markTeacherMessageRead,
  getTeacherUnreadCount
} from '../services/teacherMessageService';
import { subscribeToMessages, subscribeToSocketReconnect } from '../services/socket';
import {
  MessageSquare,
  Send,
  User,
  Users,
  Search,
  PlusCircle,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  X,
  RefreshCw,
  Phone,
  Mail
} from 'lucide-react';

const TeacherMessages = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorBanner, setErrorBanner] = useState(null);

  // New Conversation Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [messageContacts, setMessageContacts] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();

    // Subscribe to real-time message events
    const unsubscribe = subscribeToMessages((newMsg) => {
      // If message belongs to active conversation
      if (activeConversation && activeConversation.id === newMsg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, isMine: false }];
        });
        markTeacherMessageRead(newMsg.id).then((result) => {
          if (!result.success) setErrorBanner(result.error || 'Failed to mark message as read');
        });
      } else {
        setUnreadCount((prev) => prev + 1);
      }

      // Update sidebar preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: newMsg.message,
              lastMessageAt: newMsg.createdAt,
              unreadCount:
                activeConversation && activeConversation.id === newMsg.conversationId
                  ? 0
                  : (c.unreadCount || 0) + 1
            };
          }
          return c;
        })
      );
    });
    const unsubscribeReconnect = subscribeToSocketReconnect(() => {
      loadConversations();
      if (activeConversation) loadMessages(activeConversation.id);
    });

    return () => {
      unsubscribe();
      unsubscribeReconnect();
    };
  }, [activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setIsLoadingConvs(true);
    setErrorBanner(null);

    const [convsRes, unreadRes] = await Promise.all([
      getTeacherConversations(),
      getTeacherUnreadCount()
    ]);

    setIsLoadingConvs(false);

    if (convsRes.success) {
      const list = convsRes.data.conversations || [];
      setConversations(list);
      if (list.length > 0 && !activeConversation) {
        setActiveConversation(list[0]);
      }
    } else {
      setErrorBanner(convsRes.error || 'Failed to load conversations');
    }

    if (unreadRes.success) {
      setUnreadCount(unreadRes.data.unreadCount || 0);
    }
  };

  const loadMessages = async (convId) => {
    setIsLoadingMessages(true);
    const res = await getTeacherMessages(convId);
    setIsLoadingMessages(false);

    if (res.success) {
      const msgs = res.data.messages || [];
      setMessages(msgs);

      // Auto mark unread incoming messages as read
      const unreadIncoming = msgs.filter((m) => !m.isMine && !m.isRead);
      if (unreadIncoming.length > 0) {
        const readResults = await Promise.all(unreadIncoming.map((m) => markTeacherMessageRead(m.id)));
        const failedRead = readResults.find((result) => !result.success);
        if (failedRead) setErrorBanner(failedRead.error || 'Failed to mark messages as read');
        // Update local unread status and count
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
        setUnreadCount((prev) => Math.max(0, prev - unreadIncoming.length));
      }
    } else {
      setErrorBanner(res.error || 'Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    const outgoingText = messageText.trim();
    setMessageText('');
    setIsSending(true);

    const res = await sendTeacherMessage(activeConversation.id, outgoingText);
    setIsSending(false);

    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      // Update last message in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessage: outgoingText, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } else {
      setErrorBanner(res.error || 'Failed to send message');
      setMessageText((current) => current || outgoingText);
    }
  };

  const handleOpenNewModal = async () => {
    setShowNewModal(true);
    setIsModalLoading(true);
    const res = await getTeacherMessageContacts();
    setIsModalLoading(false);

    if (res.success) {
      setMessageContacts(res.data.contacts || []);
    } else {
      setErrorBanner(res.error || 'Failed to load authorized parent contacts');
    }
  };

  const handleSelectContactForConv = async (contact) => {
    if (!contact) return;
    setIsCreatingConv(true);

    const res = await createTeacherConversation({
      parentId: contact.parent.id,
      studentId: contact.student.id
    });

    setIsCreatingConv(false);

    if (res.success) {
      setShowNewModal(false);
      await loadConversations();
      setActiveConversation(res.data);
    } else {
      setErrorBanner(res.error || 'Failed to start conversation. Ensure parent is linked to student.');
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.parent?.name?.toLowerCase().includes(q) ||
      c.student?.name?.toLowerCase().includes(q) ||
      c.student?.studentId?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Teacher ↔ Parent Communication Hub • Step 7A</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Parent Direct Messages 💬</h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              Communicate securely with parents regarding attendance, homework submissions, and academic progress.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold">{unreadCount} Unread {unreadCount === 1 ? 'Message' : 'Messages'}</span>
            </div>
            <button
              onClick={loadConversations}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors"
              title="Refresh conversations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="p-1 hover:bg-rose-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Workspace (Split View) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] max-h-[750px]">
        
        {/* Left Sidebar: Conversations List (5 Cols) */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          
          {/* Search & New Chat Bar */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Chats ({conversations.length})</h2>
              <button
                onClick={handleOpenNewModal}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search parent or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConvs ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading chats...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No conversations found</p>
                <p className="text-[11px]">Click "New Chat" to message a parent from your class roster.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-4 text-left transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                        : 'hover:bg-white bg-slate-50/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {conv.parent?.name?.charAt(0).toUpperCase() || 'P'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {conv.parent?.name || 'Parent'}
                        </h4>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Student Context Tag */}
                      <p className="text-[11px] font-medium text-emerald-700 flex items-center space-x-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 shrink-0" />
                        <span className="truncate">{conv.student?.name} ({conv.student?.className || 'Class'})</span>
                      </p>

                      <p className="text-xs text-slate-500 truncate mt-1">
                        {conv.lastMessage || <span className="italic text-slate-400">No messages yet</span>}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Thread (7 Cols) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-white">
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200">
                    {activeConversation.parent?.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {activeConversation.parent?.name || 'Parent'}
                      </h3>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {activeConversation.parent?.relationship || 'Guardian'}
                      </span>
                    </div>

                    {/* Student Context Badge */}
                    <p className="text-xs text-slate-500 mt-0.5">
                      Student: <strong className="text-emerald-700">{activeConversation.student?.name}</strong> • Roll: #{activeConversation.student?.rollNumber || '—'} • {activeConversation.student?.className} ({activeConversation.student?.section})
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 hidden sm:block">
                  <span className="font-mono">ID: {activeConversation.student?.studentId}</span>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20">
                {isLoadingMessages ? (
                  <div className="py-12 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Loading conversation thread...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center space-y-2 text-slate-400">
                    <HeartHandshake className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No messages yet in this conversation</p>
                    <p className="text-[11px]">Send a message below to start communicating with {activeConversation.parent?.name}.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-1 px-1">
                        <span>{m.isMine ? 'You (Teacher)' : m.sender?.name || 'Parent'}</span>
                        <span>•</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          m.isMine
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      </div>

                      {m.isMine && (
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-0.5 px-1">
                          {m.isRead ? (
                            <span className="text-emerald-600 flex items-center space-x-0.5">
                              <CheckCheck className="w-3 h-3" />
                              <span>Read</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-0.5">
                              <Check className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Message ${activeConversation.parent?.name || 'Parent'}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <button
                  type="submit"
                  disabled={isSending || !messageText.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">No Conversation Selected</h3>
              <p className="text-xs max-w-sm">
                Select a conversation from the sidebar or click "New Chat" to begin messaging a parent.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* NEW CONVERSATION MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Start Parent Conversation</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a student from your assigned classroom roster to start or open a direct chat thread with their parent:
            </p>

            {isModalLoading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading student roster...</p>
              </div>
            ) : messageContacts.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs italic">
                No linked parents are available for your assigned students.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto border border-slate-100 rounded-2xl">
                {messageContacts.map((contact) => (
                  <button
                    key={`${contact.parent.id}-${contact.student.id}`}
                    onClick={() => handleSelectContactForConv(contact)}
                    disabled={isCreatingConv}
                    className="w-full p-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{contact.parent.name}</p>
                      <p className="text-[11px] text-slate-400">
                        For {contact.student.name} · {contact.student.className || 'Class'} {contact.student.section}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {isCreatingConv ? 'Opening...' : 'Message Parent →'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowNewModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherMessages;

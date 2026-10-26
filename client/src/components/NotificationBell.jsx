import React, { useState, useEffect, useRef } from 'react';
import {
  getNotifications,
  getNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../services/notificationService';
import { subscribeToNotifications } from '../services/socket';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ClipboardList,
  CalendarCheck,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  Loader2,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const typeIcons = {
  HOMEWORK: <ClipboardList className="w-4 h-4 text-blue-600" />,
  ATTENDANCE: <CalendarCheck className="w-4 h-4 text-emerald-600" />,
  MARKS: <FileSpreadsheet className="w-4 h-4 text-purple-600" />,
  MESSAGE: <MessageSquare className="w-4 h-4 text-amber-600" />,
  GENERAL: <Bell className="w-4 h-4 text-slate-600" />
};

const typeColors = {
  HOMEWORK: 'bg-blue-50 border-blue-200 text-blue-800',
  ATTENDANCE: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  MARKS: 'bg-purple-50 border-purple-200 text-purple-800',
  MESSAGE: 'bg-amber-50 border-amber-200 text-amber-800',
  GENERAL: 'bg-slate-50 border-slate-200 text-slate-800'
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'HOMEWORK' | 'ATTENDANCE' | 'MARKS' | 'MESSAGE'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll unread count on mount & subscribe to real-time notification events
  useEffect(() => {
    loadUnreadCount();

    // Subscribe to real-time notification WebSocket event
    const unsubscribe = subscribeToNotifications((newNotif) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => {
        // Prevent duplicate notification
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    });

    const interval = setInterval(loadUnreadCount, 60000); // 60s fallback poll
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Load notifications when dropdown is opened or filter/page changes
  useEffect(() => {
    if (isOpen) {
      loadNotificationList(1, true);
    }
  }, [isOpen, activeFilter]);

  const loadUnreadCount = async () => {
    const res = await getNotificationUnreadCount();
    if (res.success) {
      setUnreadCount(res.data.unreadCount || 0);
    }
  };

  const loadNotificationList = async (pageNum = 1, replace = false) => {
    setIsLoading(true);
    setErrorBanner(null);

    const params = {
      page: pageNum,
      limit: 15
    };

    if (activeFilter === 'UNREAD') {
      params.unread = true;
    } else if (activeFilter !== 'ALL') {
      params.type = activeFilter;
    }

    const res = await getNotifications(params);
    setIsLoading(false);

    if (res.success) {
      const data = res.data;
      setPage(data.page);
      setTotalPages(data.totalPages);
      if (replace || pageNum === 1) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
      }
    } else {
      setErrorBanner(res.error || 'Failed to load notifications');
    }
  };

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    const res = await markNotificationRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    const res = await markAllNotificationsRead();
    setIsMarkingAll(false);

    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } else {
      setErrorBanner(res.error || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const targetNotif = notifications.find((n) => n.id === id);
    const res = await deleteNotification(id);
    if (res.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (targetNotif && !targetNotif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const formatTimestamp = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn flex flex-col max-h-[580px]">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors flex items-center space-x-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="p-2 border-b border-slate-100 bg-white flex items-center space-x-1 overflow-x-auto text-[11px] font-bold">
            {['ALL', 'UNREAD', 'HOMEWORK', 'ATTENDANCE', 'MARKS', 'MESSAGE'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setActiveFilter(f);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === f
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'UNREAD' ? 'Unread' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="p-2.5 bg-rose-50 border-b border-rose-100 text-rose-800 text-[11px] flex items-center justify-between">
              <span>{errorBanner}</span>
              <button onClick={() => setErrorBanner(null)}>
                <X className="w-3 h-3 text-rose-600" />
              </button>
            </div>
          )}

          {/* Scrollable Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-slate-400 px-4">
                <Bell className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No notifications found</p>
                <p className="text-[11px]">
                  {activeFilter === 'UNREAD'
                    ? 'No unread notifications at this time.'
                    : 'You will receive alerts here for homework, attendance, marks, and messages.'}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`p-3.5 transition-colors flex items-start space-x-3 cursor-pointer ${
                    n.isRead
                      ? 'bg-white hover:bg-slate-50 opacity-75'
                      : 'bg-indigo-50/40 hover:bg-indigo-50/70 border-l-3 border-indigo-600'
                  }`}
                >
                  {/* Type Icon */}
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {typeIcons[n.type] || <Bell className="w-4 h-4 text-slate-500" />}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs truncate ${n.isRead ? 'font-semibold text-slate-700' : 'font-black text-slate-900'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                        typeColors[n.type] || 'bg-slate-100'
                      }`}>
                        {n.type}
                      </span>

                      <div className="flex items-center space-x-2">
                        {!n.isRead && (
                          <button
                            onClick={(e) => handleMarkRead(n.id, e)}
                            className="text-[10px] text-indigo-600 hover:underline font-bold"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Load More (if more pages exist) */}
          {page < totalPages && (
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
              <button
                onClick={() => loadNotificationList(page + 1, false)}
                disabled={isLoading}
                className="text-xs font-bold text-indigo-600 hover:underline py-1"
              >
                {isLoading ? 'Loading...' : 'Load more notifications'}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default NotificationBell;

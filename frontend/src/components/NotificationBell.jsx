import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  Bell,
  CheckCheck,
  Calendar,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      // Graceful fallback if unauthenticated or network issue
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Polling every 20s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.reference_type === 'booking' && notif.reference_id) {
      navigate(`/customer/bookings/${notif.reference_id}`);
    } else if (notif.reference_type === 'request' || notif.notification_type === 'REQUEST_UPDATE') {
      navigate('/customer/requests');
    } else if (notif.notification_type === 'PROVIDER_APPLICATION' || notif.reference_type === 'verification') {
      navigate('/admin/verifications');
    } else if (notif.notification_type === 'COMPLAINT') {
      navigate('/admin/disputes');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BOOKING_STATUS':
      case 'BOOKING_CREATED':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'MESSAGE':
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'COMPLAINT':
      case 'DISPUTE':
        return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'VERIFICATION':
      case 'VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'QUOTATION':
        return <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications"
        aria-label="View notifications"
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No notifications yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  We will notify you about bookings, quotations, and status updates here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    !notif.is_read
                      ? 'bg-blue-50/40 dark:bg-blue-950/20'
                      : 'opacity-85'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{notif.created_at}</span>
                      {notif.reference_id && (
                        <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

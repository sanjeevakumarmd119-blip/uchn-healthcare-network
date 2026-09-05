'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/lib/utils';
import { NotificationItem } from '@/types';
import { BackButton } from '@/components/common/BackButton';
import Link from 'next/link';

export default function DoctorNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setNotifications(json.data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl space-y-6">
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <BackButton fallbackUrl="/doctor" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational alerts, emergency triggers, appointment schedules, and inventory warnings.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-sky-700"
            className="text-xs text-sky-700 self-start sm:self-auto tap-bounce"
          >
            Mark all {unreadCount} as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No notifications</h3>
          <p className="text-xs text-slate-500 mt-1">You are all caught up with your clinical updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 border transition-all ${
                notif.isRead ? 'border-slate-200 bg-white opacity-80' : 'border-sky-300 bg-sky-50/40 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {notif.title}
                    </h3>
                    <Badge
                      variant={
                        notif.type === 'EMERGENCY'
                          ? 'emergency'
                          : notif.type === 'INVENTORY'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-[9px]"
                    >
                      {notif.type}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>{formatDate(notif.createdAt)} at {formatTime(notif.createdAt)}</span>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                      >
                        Action Link <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => markSingleAsRead(notif.id)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-white transition-colors"
                    title="Mark read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


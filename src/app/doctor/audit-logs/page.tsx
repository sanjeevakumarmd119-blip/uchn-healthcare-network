'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Shield,
  Clock,
  User,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/common/BackButton';
import { formatDate, formatTime } from '@/lib/utils';
import { AuditLogItem } from '@/types';

export default function DoctorAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/audit-logs?limit=50');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setLogs(json.data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <BackButton fallbackUrl="/doctor" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Security & Operations Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable trace of critical healthcare state transitions, emergency dispatches, and inventory changes.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={isLoading}
          className="text-xs gap-1.5 self-start sm:self-auto tap-bounce"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No audit logs recorded yet</h3>
        </div>
      ) : (
        <Card className="border border-slate-200 shadow-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-3">Entity</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-4">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-sans font-semibold">
                      {log.entity}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-sans">
                      {log.actor ? `${log.actor.firstName} ${log.actor.lastName} (${log.actor.role})` : 'System'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-sans">
                      {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-md truncate">
                      {log.metadata || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
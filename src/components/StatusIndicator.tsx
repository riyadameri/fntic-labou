/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertTriangle } from 'lucide-react';

export default function StatusIndicator() {
  const [status, setStatus] = useState<{
    connected: boolean;
    mode: string;
    uriProvided: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/db-status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => console.error('Error fetching database status', err));
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 mt-auto font-mono">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-500" />
        <span className="font-semibold text-slate-700">قاعدة البيانات:</span>
        <span className="text-slate-600">{status.mode}</span>
      </div>
      <div className="flex items-center gap-2">
        {status.connected ? (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            MongoDB Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Local JSON Fallback Active (No MONGODB_URI)
          </span>
        )}
      </div>
    </div>
  );
}

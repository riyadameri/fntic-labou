/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  Check, 
  X, 
  RefreshCw, 
  Calendar, 
  Sparkles,
  Inbox,
  AlertCircle,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudySchedule, Equipment } from '../types';

export interface AppNotification {
  id: string;
  type: 'maintenance' | 'conflict';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'info';
  timestamp: string;
  details?: string;
  meta?: {
    key?: string;
    schedules?: StudySchedule[];
    id?: string;
    name?: string;
    labName?: string;
    status?: string;
    points?: any[];
  };
}

interface NotificationCenterProps {
  onNotificationCountChange?: (count: number) => void;
}

export default function NotificationCenter({ onNotificationCountChange }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'maintenance' | 'conflicts'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);

  // Load dismissed alert IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lab_dismissed_notifications');
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load dismissed notifications:', err);
    }
  }, []);

  // Fetch data and analyze alerts
  const fetchDataAndAnalyze = async () => {
    setLoading(true);
    try {
      const [schedulesRes, equipmentRes] = await Promise.all([
        fetch('/api/schedules').then((r) => r.json()),
        fetch('/api/equipment').then((r) => r.json())
      ]);

      const schedules: StudySchedule[] = Array.isArray(schedulesRes) ? schedulesRes : [];
      const equipment: Equipment[] = Array.isArray(equipmentRes) ? equipmentRes : [];

      const detectedAlerts: AppNotification[] = [];

      // 1. Detect scheduling conflicts (Double Booking)
      // A conflict exists if two schedules have the same laboratoryId AND the same timeSlot
      // OR the same professorId AND the same timeSlot
      const labSlots: { [key: string]: StudySchedule[] } = {};
      const profSlots: { [key: string]: StudySchedule[] } = {};

      schedules.forEach((sch) => {
        if (!sch.timeSlot) return;
        const slotNormalized = sch.timeSlot.trim().toLowerCase();
        
        // Group by lab
        const labKey = `${sch.laboratoryId}_${slotNormalized}`;
        if (!labSlots[labKey]) labSlots[labKey] = [];
        labSlots[labKey].push(sch);

        // Group by professor
        const profKey = `${sch.professorId}_${slotNormalized}`;
        if (!profSlots[profKey]) profSlots[profKey] = [];
        profSlots[profKey].push(sch);
      });

      // Lab conflicts
      Object.keys(labSlots).forEach((key) => {
        const list = labSlots[key];
        if (list.length > 1) {
          const first = list[0];
          const others = list.slice(1);
          const otherNames = others.map(o => `"${o.subject}"`).join(' و ');
          detectedAlerts.push({
            id: `conflict_lab_${key}`,
            type: 'conflict',
            title: 'تعارض حجز مخبر علمي',
            description: `المخبر "${first.laboratoryName}" محجوز لأكثر من حصة في وقت واحد: "${first.subject}" مع ${otherNames} في الحصة: ${first.timeSlot}`,
            severity: 'high',
            timestamp: 'تعارض نشط',
            details: `تداخل التوقيت يحرم المجموعات من الحصص كاملة. ينصح بتعديل مكان أحد الحصص إلى مخبر بديل.`,
            meta: { key, schedules: list }
          });
        }
      });

      // Professor conflicts
      Object.keys(profSlots).forEach((key) => {
        const list = profSlots[key];
        if (list.length > 1) {
          const first = list[0];
          const others = list.slice(1);
          const otherNames = others.map(o => `"${o.subject}"`).join(' و ');
          detectedAlerts.push({
            id: `conflict_prof_${key}`,
            type: 'conflict',
            title: 'تعارض توقيت الأستاذ',
            description: `الأستاذ المحاضر "${first.professorName}" مسجل في جدول بأكثر من مادة في نفس التوقيت: "${first.subject}" مع ${otherNames} في الحصة: ${first.timeSlot}`,
            severity: 'high',
            timestamp: 'تعارض نشط',
            details: `يتعذر حضور الأستاذ في مخبرين بوقت واحد. يرجى التواصل مع رئيس القسم أو منسق البرمجة لتصحيح الجدول.`,
            meta: { key, schedules: list }
          });
        }
      });

      // 2. Scan equipment for issues
      equipment.forEach((eq) => {
        if (eq.validity === 'Damaged') {
          detectedAlerts.push({
            id: `equip_damaged_${eq._id || eq.id}`,
            type: 'maintenance',
            title: 'تلف عتاد مخبري حرج',
            description: `العتاد "${eq.name}" في مخبر "${eq.laboratoryName}" مسجل كـ "تالف أو متوقف عن العمل".`,
            severity: 'high',
            timestamp: 'حالة تلف حاد',
            details: `يؤثر تلف الأجهزة على جاهزية الإعارة للطلاب وأنشطة التدريس. يرجى توجيه طلب صيانة فوري أو استبدال القطعة.`,
            meta: { id: eq._id || eq.id, name: eq.name, labName: eq.laboratoryName, status: eq.validity }
          });
        } else if (eq.validity === 'Needs Maintenance') {
          detectedAlerts.push({
            id: `equip_maintenance_${eq._id || eq.id}`,
            type: 'maintenance',
            title: 'قطعة بحاجة لصيانة ملحّة',
            description: `أداة الاستعارة "${eq.name}" (مخبر ${eq.laboratoryName}) تم تصنيفها كبحاجة لصيانة وقائية.`,
            severity: 'medium',
            timestamp: 'أمر صيانة متأرجح',
            details: `يتوجب على مسؤول المخابر تعبئة تقرير ضبط أو تفتيش ومعاينتها وقائياً لمنع التلف الكلي.`,
            meta: { id: eq._id || eq.id, name: eq.name, labName: eq.laboratoryName, status: eq.validity }
          });
        }

        // Check calibration pending
        if (eq.calibrationSchedule && Array.isArray(eq.calibrationSchedule)) {
          const pendingPoints = eq.calibrationSchedule.filter(cp => cp.status === 'Pending');
          if (pendingPoints.length > 0) {
            detectedAlerts.push({
              id: `equip_calib_${eq._id || eq.id}`,
              type: 'maintenance',
              title: 'معايرة دورية معلقة',
              description: `العتاد القياسي "${eq.name}" يحتوي على جلسة معايرة معلقة (مخبر ${eq.laboratoryName}).`,
              severity: 'info',
              timestamp: 'معايرة منتظرة',
              details: `تأجيل المعايرة يسلب العتاد ميزة المطابقة المطلوبة لعلامة الجودة ISO والأخطاء الصغرى ببحوث الجامعة.`,
              meta: { id: eq._id || eq.id, name: eq.name, labName: eq.laboratoryName, points: pendingPoints }
            });
          }
        }
      });

      setNotifications(detectedAlerts);
    } catch (err) {
      console.error('Error compiling maintenance & scheduling alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount and set up automatic polling (every 12 seconds for live feeling)
  useEffect(() => {
    fetchDataAndAnalyze();

    const interval = setInterval(() => {
      fetchDataAndAnalyze();
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Filter out any dismissed notifications
  const visibleNotifications = notifications.filter(
    (notif) => !dismissedIds.includes(notif.id)
  );

  // Trigger callback when unread notifications list changes
  useEffect(() => {
    if (onNotificationCountChange) {
      onNotificationCountChange(visibleNotifications.length);
    }
  }, [visibleNotifications.length, onNotificationCountChange]);

  // Audio system alert generator for critical changes
  useEffect(() => {
    if (audioAlertEnabled && visibleNotifications.length > 0) {
      // Look if there are any high severity items we haven't seen in this session
      const hasHighSeverity = visibleNotifications.some(n => n.severity === 'high');
      if (hasHighSeverity) {
        // Safe play sound or chime
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.type = 'sine';
          // Warm harmonic chime frequency
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
          oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.15); // C#5
          oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5
          
          gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.6);
        } catch (e) {
          // Keep failure passive
        }
      }
    }
  }, [visibleNotifications.length]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDismissed = [...dismissedIds, id];
    setDismissedIds(nextDismissed);
    try {
      localStorage.setItem('lab_dismissed_notifications', JSON.stringify(nextDismissed));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
    try {
      localStorage.removeItem('lab_dismissed_notifications');
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = visibleNotifications.filter((notif) => {
    if (activeTab === 'maintenance') return notif.type === 'maintenance';
    if (activeTab === 'conflicts') return notif.type === 'conflict';
    return true;
  });

  return (
    <div className="relative font-sans text-right" dir="rtl">
      {/* Bell Button */}
      <button
        id="notification-center-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-slate-900 border-slate-800 text-white shadow-lg'
            : visibleNotifications.length > 0
            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
        title="مركز التنبيهات المباشر"
      >
        <Bell className={`w-5 h-5 ${visibleNotifications.length > 0 && !isOpen ? 'animate-bounce' : ''}`} />
        
        {visibleNotifications.length > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white font-mono font-black text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {visibleNotifications.length}
          </span>
        )}
      </button>

      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click dismisser */}
            <div 
              className="fixed inset-0 z-40 cursor-default" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              id="notification-center-popover-card"
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 mt-3 w-[360px] sm:w-[420px] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header Title Accent */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs">مركز الإشعارات المباشر</h3>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">رصد صيانة العتاد وتعارض جدولة المخابر علمياً</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAudioAlertEnabled(!audioAlertEnabled)}
                    className={`p-1.5 rounded-lg border transition-all text-[10px] ${
                      audioAlertEnabled 
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20' 
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                    title={audioAlertEnabled ? 'كتم رنين الانذار الصوتي' : 'تفعيل رنين انذار صوتي فوري'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={fetchDataAndAnalyze}
                    disabled={loading}
                    className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 rounded-lg transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 rounded-lg transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabs list filter */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
                {[
                  { id: 'all', label: 'الجميع', count: visibleNotifications.length },
                  { id: 'maintenance', label: 'صيانة العتاد', count: visibleNotifications.filter(n => n.type === 'maintenance').length },
                  { id: 'conflicts', label: 'تعارض الجدولة', count: visibleNotifications.filter(n => n.type === 'conflict').length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 px-1 text-center font-bold text-[11px] rounded-lg transition-colors cursor-pointer relative ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="mr-1 inline-block align-middle text-[9px] bg-slate-100 px-1.5 py-0.2 rounded-full font-sans font-black text-slate-750">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Alerts scroll list */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 bg-white">
                {filtered.length === 0 ? (
                  <div className="py-12 px-6 text-center flex flex-col items-center justify-center text-slate-400">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-3">
                      <Inbox className="w-8 h-8 text-slate-300" />
                    </div>
                    <span className="block font-bold text-xs text-slate-700">لا توجد تنبيهات نشطة حالياً</span>
                    <span className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
                      نظام التحليل التلقائي يفحص الجداول وصلاحية العتاد باستمرار ولم يجد أي خلل فني أو تعارض.
                    </span>
                    {dismissedIds.length > 0 && (
                      <button
                        onClick={handleResetDismissed}
                        className="mt-4 text-[10px] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        🔄 استعادة الإشعارات المؤرشفة ({dismissedIds.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {filtered.map((notif) => {
                      const isHigh = notif.severity === 'high';
                      const isMedium = notif.severity === 'medium';
                      
                      return (
                        <div
                          key={notif.id}
                          className={`p-3.5 rounded-xl border transition-all flex gap-3 group relative ${
                            isHigh
                              ? 'bg-rose-50/50 hover:bg-rose-50 border-rose-100'
                              : isMedium
                              ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-100'
                              : 'bg-indigo-50/40 hover:bg-indigo-50 border-indigo-100/55'
                          }`}
                        >
                          {/* Left Severity strip bar */}
                          <div className={`absolute top-0 bottom-0 right-0 w-1 rounded-r-xl ${
                            isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-indigo-400'
                          }`} />

                          {/* Icon mapping */}
                          <div className="flex-shrink-0 mt-0.5">
                            {notif.type === 'conflict' ? (
                              <div className={`p-2 rounded-xl border ${
                                isHigh ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-indigo-100 border-indigo-200 text-indigo-700'
                              }`}>
                                <Calendar className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className={`p-2 rounded-xl border ${
                                isHigh 
                                  ? 'bg-rose-100 border-rose-200 text-rose-700' 
                                  : isMedium 
                                  ? 'bg-amber-100 border-amber-200 text-amber-700' 
                                  : 'bg-indigo-100 border-indigo-200 text-indigo-700'
                              }`}>
                                <Wrench className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-1 text-right">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-[12px] text-slate-900 group-hover:text-slate-950 transition-colors">
                                {notif.title}
                              </span>
                              <span className="text-[8.5px] font-sans font-bold text-slate-400 whitespace-nowrap bg-white border border-slate-100 rounded px-1.5 py-0.5">
                                {notif.timestamp}
                              </span>
                            </div>

                            <p className="text-[10.5px] text-slate-650 leading-relaxed mt-1 font-medium">
                              {notif.description}
                            </p>

                            {notif.details && (
                              <div className="mt-2 p-2 bg-white/70 border border-slate-100 rounded-lg text-[9.5px] text-slate-500 leading-normal">
                                {notif.details}
                              </div>
                            )}

                            {/* Meta info tag representation */}
                            {notif.meta && notif.meta.status && (
                              <div className="mt-2 flex items-center gap-1">
                                <span className="text-[8px] font-black bg-slate-900 text-white rounded px-1.5 py-0.2 uppercase">
                                  بوابة الصيانة النشطة
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions: Dismiss Button */}
                          <button
                            onClick={(e) => handleDismiss(notif.id, e)}
                            className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-all self-start"
                            title="تجاهل وأرشفة"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status footer with action */}
              {visibleNotifications.length > 0 && (
                <div className="p-3 bg-slate-50 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-450 font-bold">
                  <span>تم الفحص تلقائياً ودورياً في الخلفية</span>
                  <button
                    onClick={handleResetDismissed}
                    className="text-indigo-650 hover:text-indigo-800 transition-colors"
                  >
                    إعادة تصفير الإلغاء ({dismissedIds.length})
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

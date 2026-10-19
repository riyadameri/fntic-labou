/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Tv,
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle,
  Volume2,
  Cpu,
  Monitor,
  Flame,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { StudySchedule } from '../types';

interface TvDisplayDashboardProps {
  onBack: () => void;
}

export default function TvDisplayDashboard({ onBack }: TvDisplayDashboardProps) {
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [tickerIndex, setTickerIndex] = useState(0);

  // Urgent student guidelines scrolling ticker
  const tickers = [
    "📌 تنبيه هام: يرجى ارتداء المئزر الأبيض والالتزام بقواعد السلامة ISO قبل الدخول لأي مخبر تجنباً للإقصاء.",
    "🔑 تذكير للأساتذة الكرام: يرجى تمرير بطاقة الـ RFID على القارئ الذكي للمخبر لتسجيل الحضور تلقائياً وتفعيل تيار الأجهزة.",
    "💻 تنبيه: يمنع منعا كلياً إدخال الأطعمة أو المشروبات إلى مخبر شبكات الحاسوب والإلكترونيات حفاظاً على سلامة العتاد.",
    "🛡️ تظلمات الطلاب: يمكن لأي طالب تقديم شكوى أو تبليغ عن عتاد معطل عبر بوابة حساب الطالب للمتابعة الفورية.",
    "🚀 جديد: تم تدعيم مخبر الروبوتات ببطاقات Raspberry Pi 4 جديدة قابلة للاستعارة المصرحة للبحوث."
  ];

  useEffect(() => {
    fetchSchedules();
    // Clock trigger
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Ticker trigger
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickers.length);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(tickerTimer);
    };
  }, []);

  const fetchSchedules = () => {
    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => setSchedules(data))
      .catch((err) => console.error(err));
  };

  // Safe formatting helpers
  const formatTimeStr = (date: Date) => {
    return date.toLocaleTimeString('fa-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDateStr = (date: Date) => {
    return date.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between overflow-hidden relative" dir="rtl">
      {/* Background Decorative Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Modern Sci-Fi Top Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* TV Header Banner (Highly Professional Dashboard Style) */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-indigo-400 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1 text-slate-300 group"
              title="العودة للوحة التحكم الرئيسية"
            >
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">الخروج</span>
            </button>
            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
            
            <div className="text-right">
              <span className="text-[10px] md:text-sm font-bold tracking-widest text-[#22c55e] block">
                جامعة قاصدي مرباح ورقلة
              </span>
              <h1 className="text-base sm:text-lg font-black text-white hover:text-indigo-300 transition-colors">
                كلية التكنولوجيا الحديثة للمعلومات والاتصال
              </h1>
            </div>
          </div>

          {/* Title Card */}
          <div className="bg-indigo-950/80 px-4 py-1.5 rounded-2xl border border-indigo-500/30 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[11px] font-black tracking-wider text-indigo-200">
              📺 شاشة العرض التلفزيونية الذكية للمخابر (TV Live)
            </span>
          </div>

          {/* Time & Date Display */}
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner">
            <div className="text-left font-mono">
              <span className="text-xl sm:text-2xl font-black text-indigo-400 block tracking-wider tabular-nums">
                {formatTimeStr(currentTime)}
              </span>
              <span className="text-[10px] text-slate-400 block font-sans">
                {formatDateStr(currentTime)}
              </span>
            </div>
            <Clock className="w-8 h-8 text-indigo-500 animate-pulse hidden sm:block" />
          </div>

        </div>
      </header>

      {/* Main TV Layout Core */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 overflow-y-auto">
        
        {/* RIGHT COLUMN: Current Status & Alerts */}
        <div className="space-y-6 lg:col-span-1">
          {/* Active Lab Pulse Card */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 bg-indigo-500/10 px-3 py-1 rounded-br-2xl text-[10px] font-bold text-indigo-300 flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5 animate-pulse" /> البث الأكاديمي الحقيقي
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                  <Cpu className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#22c55e] text-xs">حالة المخابر الآن</h3>
                  <p className="text-xs text-slate-300 font-bold mt-1">المعايرة: حية وتلقائية بالكامل المعيار ISO 9001</p>
                </div>
              </div>
              
              <div className="h-px bg-slate-800"></div>

              {/* Status statistics */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-2xl font-extrabold text-[#22c55e] font-mono block">3</span>
                  <span className="text-[10px] text-slate-400">مخابر مشتغلة</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-2xl font-extrabold text-indigo-400 font-mono block">
                    {schedules.length}
                  </span>
                  <span className="text-[10px] text-slate-400">حصة عملي مبرمجة</span>
                </div>
              </div>

              {/* Occupied highlight */}
              <div className="p-3 bg-red-950/50 border border-red-500/20 rounded-xl flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                <div className="text-[11px]">
                  <p className="font-bold text-red-200">الاستخدام الحالي للطاقة الفنية</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">85% من طاقة الحواسيب تحت العمل لدروس البرمجة والشبكات.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Informative TV Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Volume2 className="w-4.5 h-4.5 text-indigo-400" />
              توجيهات العمادة واللجنة الفنية
            </h3>
            
            <div className="space-y-3 text-[11px] text-slate-300">
              <div className="p-3.5 bg-slate-950 rounded-xl border-r-4 border-emerald-500 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">أي تجهيز تظهر حالته كـ <strong className="text-emerald-400">"أحمر"</strong> في المخابر يرجى عدم تشغيله إلا باستدعاء مسؤول الصيانة فوراً.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border-r-4 border-amber-500 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">يرجى تسجيل الطلبات لاستعارة الأردوينو و Raspberry Pi 4 قبل 24 ساعة لضمان الشحن المسبق والتحضير الفني.</p>
              </div>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Large Schedules List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-[#22c55e]" />
                    جدول الحصص العملية النشط لهذا الأسبوع
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">استعراض المواعيد بالزمن الفعلي على شاشة تليفزيون الكلية</p>
                </div>
                <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold">
                  تحديث تلقائي مستمر
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="py-24 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <Tv className="w-16 h-16 mx-auto mb-3 text-slate-700 animate-pulse" />
                  لا توجد حصص مسجلة بالجدول الجامعي للمخبر حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {schedules.map((sch) => (
                    <div
                      key={sch._id || sch.id}
                      className="p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-colors flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Neon bottom status light */}
                      <span className="absolute bottom-0 right-0 left-0 h-1 bg-emerald-500"></span>
                      
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-xl text-[10px] font-bold text-indigo-300">
                            🏢 {sch.laboratoryName}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {sch.timeSlot}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-[#22c55e] text-sm tracking-tight leading-snug group-hover:text-white transition-colors">
                            {sch.subject}
                          </h4>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium select-none">الأستاذ المحاضر:</span>
                        <span className="font-bold text-white tracking-wide bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          👤 {sch.professorName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simulated Live Broadcast watermark info */}
            <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>نظام الجدولة الفنية - شاشة العرض الرقمية للممرات (Display Hub v2.1 Algeria)</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  البث نشط
                </span>
                <span>|</span>
                <span className="font-mono">IP: 192.168.12.55</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* FOOTER SCROLLING NEWS TICKER: Simulated Television Ticker */}
      <footer className="bg-[#1e1b4b] border-t-2 border-indigo-500 relative z-20 h-12 flex items-center overflow-hidden shadow-2xl">
        {/* Ticker Badge label */}
        <div className="bg-[#b91c1c] text-white px-6 h-full flex items-center gap-2 font-black text-xs sm:text-sm shadow-lg relative z-30 select-none animate-pulse">
          <Tv className="w-4 h-4" />
          شريط التوجيهات العاجل
        </div>
        
        {/* Scrolling list */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="absolute left-0 right-0 py-1 px-4 text-xs font-semibold text-indigo-100 whitespace-nowrap animate-marquee flex items-center">
            {tickers[tickerIndex]}
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import {
  Calendar,
  Wrench,
  AlertCircle,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Search,
  Filter,
  Grid,
  List,
  Info
} from 'lucide-react';
import { StudySchedule, Equipment, BorrowRequest, Complaint } from '../types';
import NotificationCenter from './NotificationCenter';

interface StudentDashboardProps {
  onBack: () => void;
}

export default function StudentDashboard({ onBack }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'borrow' | 'complaints'>('schedule');
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form inputs
  const [studentName, setStudentName] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [complaintName, setComplaintName] = useState('');
  const [targetRole, setTargetRole] = useState<'Department Head' | 'Dean' | 'Lab Supervisor' | 'Secretary General'>('Lab Supervisor');
  const [complaintText, setComplaintText] = useState('');

  // UI state
  const [searchScheduleQuery, setSearchScheduleQuery] = useState('');
  const [searchEquipQuery, setSearchEquipQuery] = useState('');

  useEffect(() => {
    fetchSchedules();
    fetchEquipment();
    fetchBorrowRequests();
    fetchComplaints();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchSchedules = () => {
    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => setSchedules(data))
      .catch((err) => console.error(err));
  };

  const fetchEquipment = () => {
    fetch('/api/equipment')
      .then((res) => res.json())
      .then((data) => {
        // filter borrowable equipment only
        setEquipmentList(data.filter((eq: Equipment) => eq.isBorrowable));
      })
      .catch((err) => console.error(err));
  };

  const fetchBorrowRequests = () => {
    fetch('/api/borrow-requests')
      .then((res) => res.json())
      .then((data) => setBorrowRequests(data))
      .catch((err) => console.error(err));
  };

  const fetchComplaints = () => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => setComplaints(data))
      .catch((err) => console.error(err));
  };

  const handleBorrowRequest = (e: FormEvent) => {
    e.preventDefault();
    if (!studentName || !selectedEquipmentId) {
      showNotification('يرجى ملء جميع حقول الاستعارة وتحديد العتاد المطلوب', 'error');
      return;
    }

    const targetEq = equipmentList.find((eq) => (eq._id || eq.id) === selectedEquipmentId);
    if (!targetEq) return;

    setLoading(true);
    fetch('/api/borrow-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        equipmentId: selectedEquipmentId,
        equipmentName: targetEq.name,
        laboratoryName: targetEq.laboratoryName,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('خطأ في إرسال طلب الاستعارة');
        return res.json();
      })
      .then(() => {
        showNotification('تم إرسال طلب استعارة العتاد بنجاح! في انتظار موافقة مسؤول المخابر.', 'success');
        setStudentName('');
        setSelectedEquipmentId('');
        fetchBorrowRequests();
      })
      .catch((err) => showNotification(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  const handleComplaintRequest = (e: FormEvent) => {
    e.preventDefault();
    if (!complaintName || !complaintText) {
      showNotification('يرجى كتابة الاسم والشكوى بالتفصيل', 'error');
      return;
    }

    setLoading(true);
    fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: complaintName,
        targetRole,
        message: complaintText,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('خطأ في إرسال الشكوى');
        return res.json();
      })
      .then(() => {
        showNotification('تم تسجيل شكواك وتوجيهها إلى الجهة المحددة بنجاح.', 'success');
        setComplaintName('');
        setComplaintText('');
        fetchComplaints();
      })
      .catch((err) => showNotification(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  // High-Quality Electronic component images finder with local Algerian contextual vibe
  const getEquipmentImage = (eqName: string) => {
    const nameLow = eqName.toLowerCase();
    if (nameLow.includes('raspberry') || nameLow.includes('رسبيري') || nameLow.includes('pi')) {
      // High-quality Raspberry Pi
      return "https://images.unsplash.com/photo-1517055720413-77a0bf2589d3?auto=format&fit=crop&w=600&q=80";
    }
    if (nameLow.includes('oscilloscope') || nameLow.includes('راسم الإشارة') || nameLow.includes('Keysight')) {
      // Professional oscilloscope workbench
      return "https://images.unsplash.com/photo-1581092334651-ddf26d9aae9d?auto=format&fit=crop&w=600&q=80";
    }
    if (nameLow.includes('arduino') || nameLow.includes('أردوينو')) {
      // Crisp Arduino circuit board close-up
      return "https://images.unsplash.com/photo-1553406830-ef2513410d7c?auto=format&fit=crop&w=600&q=80";
    }
    if (nameLow.includes('multimeter') || nameLow.includes('قياس')) {
      // Electronic multimeter tester
      return "https://images.unsplash.com/photo-1601524909162-be87252be298?auto=format&fit=crop&w=600&q=80";
    }
    // General beautiful electronic circuit board design
    return "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80";
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800" dir="rtl">
      
      {/* University Branding Strip & Custom Student App Header */}
      <header className="bg-gradient-to-l from-emerald-700 via-teal-800 to-cyan-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-2 bg-black/10 border-b border-white/5 flex items-center justify-between text-[11px] font-bold">
          <span className="text-emerald-300">جامعة قاصدي مرباح ورقلة</span>
          <span className="text-slate-200">كلية التكنولوجيا الحديثة للمعلومات والاتصال</span>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onBack}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all hover:-translate-x-1 border border-white/10 flex items-center justify-center"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/20 px-2.5 py-0.5 rounded-full text-emerald-300 font-extrabold font-mono">
                بوابة الطالب الفنية / Student Hub
              </span>
              <h1 className="text-lg sm:text-2xl font-black mt-1">بوابة وحساب الطالب</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-xs flex items-center gap-2 self-stretch sm:self-auto justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">الموقع الإلكتروني والاتصالات: نشط وفوري</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Urgent Guidelines Notice */}
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-3 shadow-xs">
          <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <Info className="w-5 h-5 flex-shrink-0" />
          </span>
          <div className="text-xs sm:text-sm text-emerald-900">
            <p className="font-bold">مرحباً بك في نظام التسيير ورقمنة المخابر العلمي للكلية.</p>
            <p className="text-emerald-700/95 mt-0.5 max-w-3xl leading-relaxed">
              يمكنك الاطلاع على جدول الحصص الأسبوعية الفني والمخابر الشاغرة بمدرجات الكلية، طلب استعارة معدات وأطقم إلكترونية، أو توجيه تظلم مباشر لعمادة الكلية أو رئيس القسم لمعالجته فوراً.
            </p>
          </div>
        </div>

        {/* Floating Notification Banner */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm transition-all animate-in fade-in duration-300 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold">{message.text}</p>
          </div>
        )}

        {/* Tab Selection Row (Touch-ready and highly responsive on mobile) */}
        <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-xs max-w-lg flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 min-w-[120px] py-3 text-center rounded-xl font-extrabold text-xs transition-all ${
              activeTab === 'schedule'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>الجدول الدراسي</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('borrow')}
            className={`flex-1 min-w-[120px] py-3 text-center rounded-xl font-extrabold text-xs transition-all ${
              activeTab === 'borrow'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Wrench className="w-4 h-4" />
              <span>استعارة عتاد الكتروني</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 min-w-[120px] py-3 text-center rounded-xl font-extrabold text-xs transition-all ${
              activeTab === 'complaints'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>تسجيل شكوى وبلاغ</span>
            </div>
          </button>
        </div>

        {/* Tab Contents 1: Schedules */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-5.5 h-5.5 text-emerald-600" />
                    جدول الحصص الأسبوعية للمخابر
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    الاطلاع الفوري على تفريغ القاعات وحصص العملي للمجموعات.
                  </p>
                </div>
                
                {/* Search query */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="ابحث بالحصة أو الاسم أو المخبر..."
                    value={searchScheduleQuery}
                    onChange={(e) => setSearchScheduleQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-250 rounded-2xl text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  لا توجد حصص مضافة حالياً في جدول المخابر الفنية.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {schedules
                    .filter((sch) => {
                      if (!searchScheduleQuery) return true;
                      const qName = searchScheduleQuery.toLowerCase();
                      return (
                        sch.subject.toLowerCase().includes(qName) ||
                        sch.professorName.toLowerCase().includes(qName) ||
                        sch.laboratoryName.toLowerCase().includes(qName) ||
                        sch.timeSlot.toLowerCase().includes(qName)
                      );
                    })
                    .map((sch) => (
                      <div
                        key={sch._id || sch.id}
                        className="p-5 bg-gradient-to-br from-white to-slate-50/50 border border-slate-250 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group h-44 relative overflow-hidden"
                      >
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600"></span>
                        
                        <div>
                          <div className="flex items-center justify-between gap-2 overflow-hidden">
                            <span className="inline-block bg-emerald-50 border border-emerald-100/50 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold truncate">
                              {sch.laboratoryName}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 flex-shrink-0">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              شاغلة حالياً
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-slate-800 text-sm mt-3 leading-snug tracking-tight group-hover:text-emerald-800 transition-colors">
                            {sch.subject}
                          </h4>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                          <p className="text-[11px] text-slate-400 truncate">
                            👤 الأستاذ: <strong className="text-slate-600 font-bold">{sch.professorName}</strong>
                          </p>
                          <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {sch.timeSlot}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Contents 2: Borrow / Equipment with Real photographs */}
        {activeTab === 'borrow' && (
          <div className="space-y-6">
            
            {/* Visual Exploration of Real Electronics with photographic cards */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200">
              <div className="mb-6">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-black">
                  المعرض الفني المجهّز للطلاب
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1 flex items-center gap-2">
                  <Grid className="w-5.5 h-5.5 text-emerald-600" />
                  كاتالوج وبطاقات القطع الإلكترونية المتوفرة للاستعارة العلمية
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تصفح صوراً واقعية للعتاد المخزن بمخابرنا قبل ملء طلب الحصول عليه بالأسفل.
                </p>
              </div>

              {equipmentList.length === 0 ? (
                <div className="py-12 bg-slate-50 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  لا يوجد عتاد مأذون للاستعارة الخارجية حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {equipmentList.map((eq) => {
                    const imgUrl = eq.imageUrl || getEquipmentImage(eq.name);
                    const isSelected = selectedEquipmentId === (eq._id || eq.id);
                    return (
                      <div
                        key={eq._id || eq.id}
                        className={`bg-white rounded-2xl border overflow-hidden transition-all flex flex-col justify-between hover:shadow-md ${
                          isSelected
                            ? 'ring-2 ring-emerald-600 border-emerald-500 scale-[1.01]'
                            : 'border-slate-200 shadow-xs'
                        }`}
                      >
                        {/* High-quality Electronic Component Picture */}
                        <div className="h-44 w-full relative overflow-hidden bg-slate-900 border-b border-slate-100">
                          <img
                            src={imgUrl}
                            alt={eq.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-bold">
                            📦 مخزن العتاد الشامل
                          </span>
                        </div>

                        {/* Card Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block truncate font-medium">🛡️ يتبع لـ: {eq.laboratoryName}</span>
                            <h4 className="font-extrabold text-sm text-slate-850 tracking-tight leading-snug mt-1">{eq.name}</h4>
                          </div>

                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> سليم ومهيأ
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => setSelectedEquipmentId(eq._id || eq.id || '')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? '✓ تم تحديده' : 'اختر للطلب'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Layout divided into form and table for optimal space on desktop, single column on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form card - Left Column */}
              <div className="lg:col-span-1 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-base font-black text-slate-800 mb-2 flex items-center gap-2">
                  <Wrench className="w-5.5 h-5.5 text-emerald-600" />
                  تأكيد طلب الاستعارة للعتاد
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  يرجى ملء الاسم للتكامل مع قاعدة بيانات مسؤول الموائمة.
                </p>

                <form onSubmit={handleBorrowRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الطالب الثلاثي *</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      placeholder="امجد عبد الرحمن..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العتاد المحدد للاستعارة *</label>
                    <select
                      value={selectedEquipmentId}
                      onChange={(e) => setSelectedEquipmentId(e.target.value)}
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-bold text-slate-700"
                    >
                      <option value="">-- اختر قطعة من الكتالوج أعلاه --</option>
                      {equipmentList.map((eq) => (
                        <option key={eq._id || eq.id} value={eq._id || eq.id}>
                          {eq.name} ({eq.laboratoryName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-emerald-600 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    تأكيد وإرسال طلب الاستعارة الذكي
                  </button>
                </form>
              </div>

              {/* Borrow lists - Right Column */}
              <div className="lg:col-span-2 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
                    <Clock className="w-5.5 h-5.5 text-slate-500" />
                    سجل تتبع طلبات الاستعارة الفوري للطلاب
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">تحديث مستمر لحالة الموافقات والتسليم من مسؤول الورشة.</p>

                  {borrowRequests.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                      لا توجد طلبات مسجلة حالياً.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3">اسم الطالب المختص</th>
                            <th className="p-3">العتاد التقني</th>
                            <th className="p-3">المخبر</th>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3 text-center">حالة الطلب</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {borrowRequests.map((req) => {
                            const matchingEq = equipmentList.find((e) => (e._id || e.id) === req.equipmentId);
                            const eqImg = matchingEq?.imageUrl || getEquipmentImage(req.equipmentName);
                            return (
                              <tr key={req._id || req.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-700 whitespace-nowrap">{req.studentName}</td>
                                <td className="p-3 text-slate-600 font-medium font-bold">
                                  <div className="flex items-center gap-2">
                                    <img src={eqImg} alt={req.equipmentName} className="w-8 h-8 rounded-lg object-cover border border-slate-100 bg-white" referrerPolicy="no-referrer" />
                                    <span>{req.equipmentName}</span>
                                  </div>
                                </td>
                              <td className="p-3 text-slate-500">{req.laboratoryName}</td>
                              <td className="p-3 text-slate-400 font-mono whitespace-nowrap">{req.requestedDate}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                                    req.status === 'Pending'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                      : req.status === 'Approved'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                      : 'bg-rose-50 text-rose-800 border border-rose-100'
                                  }`}
                                >
                                  {req.status === 'Pending'
                                    ? 'قيد المراجعة الفنية'
                                    : req.status === 'Approved'
                                    ? 'تم القبول والتحضير'
                                    : 'مرفوض'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab Contents 3: complaints */}
        {activeTab === 'complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Complaint Form Left */}
            <div className="lg:col-span-1 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-base font-black text-slate-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5.5 h-5.5 text-rose-500" />
                تسجيل شكوى / بلاغ عطل فني
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                توجيه بلاغ عطل أو ملاحظة إلى الجهات المعتمدة المسؤولة عن المخابر.
              </p>

              <form onSubmit={handleComplaintRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم مقدم الشكوى *</label>
                  <input
                    type="text"
                    value={complaintName}
                    onChange={(e) => setComplaintName(e.target.value)}
                    required
                    placeholder="اسم الطالب..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">توجيه الشكوى إلى الجهة المعنية *</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-bold"
                  >
                    <option value="Lab Supervisor">مسؤول المخابر (العتاد والورشة)</option>
                    <option value="Department Head">رئيس القسم (التدريس والمجموعات والأعطال الكبرى)</option>
                    <option value="Dean">عميد الكلية (التظلمات الرسمية الكبرى والنزاعات)</option>
                    <option value="Secretary General">الأمين العام للكلية (الصيانة الإنشائية والكرباء والمازوث)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">تفاصيل العطل أو المشكلة بالتفصيل *</label>
                  <textarea
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    required
                    rows={4}
                    placeholder="اكتب هنا المشكلة، العتاد المعطل، أو الملاحظة بوضوح..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-extrabold hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  تقديم البلاغ والمتابعة الفورية
                </button>
              </form>
            </div>

            {/* Complaints Right */}
            <div className="lg:col-span-2 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5.5 h-5.5 text-[#22c55e]" />
                  سجل الشكاوى المسجلة والمكتملة
                </h3>
                <p className="text-xs text-slate-400 mb-5">تتبع مسار مراجعة تسوية الشكاوى والاستدراك الفني من المسؤولين.</p>

                {complaints.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    لا توجد شكاوى مسجّلة حالياً بالكلية.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((c) => (
                      <div key={c._id || c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className="text-xs font-extrabold text-slate-800">👤 الطالب: {c.studentName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] bg-slate-200 text-slate-755 px-2 py-0.5 rounded-lg border border-slate-300/30 font-bold">
                              موجه إلى: {
                                c.targetRole === 'Lab Supervisor' ? 'مسؤول المخابر' :
                                c.targetRole === 'Department Head' ? 'رئيس القسم' :
                                c.targetRole === 'Dean' ? 'العميد' : 'الأمين العام'
                              }
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.message}</p>
                          <span className="block text-[9px] text-slate-400 mt-2 font-mono">تاريخ الإيداع الإلكتروني: {c.requestedDate}</span>
                        </div>
                        
                        <div className="flex-shrink-0 self-end sm:self-start">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
                              c.status === 'Pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Pending' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            {c.status === 'Pending' ? 'قيد الدراسة الفنية' : 'تم تسوية الوضعية'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import {
  BookOpen,
  ArrowRight,
  Plus,
  Calendar,
  Clock,
  Layers,
  Wrench,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Laboratory, Professor, StudySchedule, Equipment } from '../types';
import NotificationCenter from './NotificationCenter';

interface ProfDashboardProps {
  onBack: () => void;
}

export default function ProfDashboard({ onBack }: ProfDashboardProps) {
  const [activeTab, setActiveTab] = useState<'schedules' | 'add_schedule' | 'labs_equipment'>('schedules');

  // Database lists
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  // Selected Professor Profile
  const [selectedProfId, setSelectedProfId] = useState<string>('');

  // Form inputs for scheduling a new class
  const [newSchSubject, setNewSchSubject] = useState('');
  const [newSchLabId, setNewSchLabId] = useState('');
  const [newSchTime, setNewSchTime] = useState('');
  // Let them optionally pick the teacher for the scheduled class, default to themselves
  const [targetProfId, setTargetProfId] = useState('');

  // Search/Filter queries
  const [searchScheduleQuery, setSearchScheduleQuery] = useState('');
  const [searchEquipQuery, setSearchEquipQuery] = useState('');

  // Loading/Feedback States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchAllData = () => {
    setLoading(true);
    const endpoints = [
      '/api/laboratories',
      '/api/professors',
      '/api/schedules',
      '/api/equipment'
    ];

    Promise.all(endpoints.map((e) => fetch(e).then((r) => r.json())))
      .then(([labs, profs, schs, equips]) => {
        setLaboratories(labs);
        setProfessors(profs);
        setSchedules(schs);
        setEquipmentList(equips);

        // Preselect the first professor profile (like أ.د. عشبي محمد السعيد) to make things seamless
        if (profs && profs.length > 0) {
          const firstProfId = profs[0]._id || profs[0].id || '';
          setSelectedProfId(firstProfId);
          setTargetProfId(firstProfId);
        }
      })
      .catch((err) => showNotification('حدث خطأ أثناء مزامنة بيانات المخابر والأساتذة: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  };

  // Submit Schedule / Class from Professor view
  const handleProfAddSchedule = (e: FormEvent) => {
    e.preventDefault();
    const activeProfId = targetProfId || selectedProfId;

    if (!newSchSubject || !activeProfId || !newSchLabId || !newSchTime) {
      showNotification('يرجى ملء كافة تفاصيل الحصة الدراسية والجدول', 'error');
      return;
    }

    const profObj = professors.find((p) => (p._id || p.id) === activeProfId);
    const labObj = laboratories.find((l) => (l._id || l.id) === newSchLabId);
    if (!profObj || !labObj) {
      showNotification('رمز الأستاذ أو رمز المخبر المحدد غير صالح', 'error');
      return;
    }

    fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: newSchSubject,
        professorId: activeProfId,
        professorName: profObj.name,
        laboratoryId: newSchLabId,
        laboratoryName: labObj.name,
        timeSlot: newSchTime,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('فشل تسجيل الحصة في الخادم');
        return res.json();
      })
      .then((newSch) => {
        setSchedules([...schedules, newSch]);
        showNotification(`تم إدراج الحصة الزجاجية "${newSch.subject}" وتفويضها للأستاذ ${newSch.professorName} بنجاح.`, 'success');
        setNewSchSubject('');
        setNewSchTime('');
        setActiveTab('schedules'); // Redirect to schedules
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Find currently active profile name
  const currentProf = professors.find((p) => (p._id || p.id) === selectedProfId);

  // Filter schedules: show user schedules vs all schedules
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');

  const filteredSchedules = schedules.filter((sch) => {
    // 1. Filter by professor id if and only if "my" schedule is active
    if (filterMode === 'my' && selectedProfId) {
      if (sch.professorId !== selectedProfId) return false;
    }
    // 2. Filter by search query
    if (searchScheduleQuery) {
      const query = searchScheduleQuery.toLowerCase();
      const subjectMatch = sch.subject.toLowerCase().includes(query);
      const profMatch = sch.professorName?.toLowerCase().includes(query);
      const labMatch = sch.laboratoryName?.toLowerCase().includes(query);
      const timeMatch = sch.timeSlot.toLowerCase().includes(query);
      return subjectMatch || profMatch || labMatch || timeMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16" dir="rtl">
      {/* Header Block with Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
              title="العودة للصفحة الرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base font-extrabold text-slate-900">حساب الأستاذ المحاضر</h1>
                <p className="text-[10px] text-slate-400 font-medium">جدولة الحصص الدراسية ومعاينة عتاد المخابر</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            {/* Quick Profile Selection */}
            <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
              <UserCheck className="w-4 h-4 text-slate-500" />
              <label className="text-xs font-bold text-slate-700 hidden sm:inline-block">الملف الشخصي المحاكي:</label>
              <select
                value={selectedProfId}
                onChange={(e) => {
                  setSelectedProfId(e.target.value);
                  setTargetProfId(e.target.value);
                }}
                className="bg-transparent border-none text-xs font-semibold text-indigo-800 focus:ring-0 cursor-pointer outline-none"
              >
                {professors.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id} className="text-slate-800">
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Quick Statistics and Tab Bar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Notifications & Feedbacks */}
        {message && (
          <div
            className={`p-4 mb-6 rounded-xl border flex items-center gap-3 animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <p className="text-xs font-semibold">{message.text}</p>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-3">
            <span className="inline-block px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 rounded-full text-[10px] font-bold">
              بيئة عمل الأستاذ الموحدة
            </span>
            <h2 className="text-xl sm:text-2xl font-black">مرحباً بك، {currentProf ? currentProf.name : 'أستاذ المادة'} 👋</h2>
            <p className="text-xs text-indigo-200 max-w-xl">
              من هنا يمكنك جدولة وإضافة حصصك الأسبوعية في مختبرات الكلية فوراً، تتبع مواعظ العملي لطلابك، ورصد حالة الأجهزة المعايرة والتجهيزات ISO المتاحة.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schedules'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            سجل الحصص والتدريس
          </button>
          <button
            onClick={() => setActiveTab('add_schedule')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'add_schedule'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            برمجة وإضافة حصة دراسية
          </button>
          <button
            onClick={() => setActiveTab('labs_equipment')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'labs_equipment'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            استكشاف المخابر والأجهزة
          </button>
        </div>

        {/* Tab Content 1: schedules */}
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
              {/* Filter Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  onClick={() => setFilterMode('my')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterMode === 'my' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  حصصي فقط
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterMode === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  جميع حصص الكلية
                </button>
              </div>

              {/* Live Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ابحث بالحصة، المخبر أو التوقيت..."
                  value={searchScheduleQuery}
                  onChange={(e) => setSearchScheduleQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            {/* Schedules Grid / List */}
            {loading ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-xs text-slate-400 mt-2 font-semibold">جاري جلب جدول الحصص الأكاديمي...</p>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                <div className="p-3 bg-slate-50 text-slate-400 w-fit rounded-full mx-auto">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700">لا توجد حصص مجدولة حالياً</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {filterMode === 'my'
                    ? 'لم يتم العثور على حصص مخصصة لك في المخابر. يمكنك النقر على لسان التبويب "برمجة وبموافقة حصة جديدة" لإدراج حصتك في الجدول فوراً.'
                    : 'لم نجد أي مطابقات لعملية البحث المحددة بالجدول العام.'}
                </p>
                {filterMode === 'my' && (
                  <button
                    onClick={() => setActiveTab('add_schedule')}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة أول حصة الآن
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchedules.map((sch) => {
                  const isMine = sch.professorId === selectedProfId;
                  return (
                    <div
                      key={sch._id || sch.id}
                      className={`bg-white rounded-2xl border p-5 space-y-4 hover:shadow-md transition-all ${
                        isMine ? 'border-indigo-400 ring-2 ring-indigo-500/5' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isMine ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isMine ? 'حصتي التعليمية' : 'مادة لقسم زميل'}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-mono text-[10px] font-bold">{sch.timeSlot}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 leading-snug">{sch.subject}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <span className="font-bold text-slate-600">المخبر:</span> {sch.laboratoryName}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200">
                          {sch.professorName?.charAt(0) || 'أ'}
                        </div>
                        <div className="text-[11px]">
                          <p className="font-bold text-slate-700">{sch.professorName}</p>
                          <p className="text-[9px] text-slate-400">أستاذ المادة الفني</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: add_schedule */}
        {activeTab === 'add_schedule' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              حجز وتفويض حصة عملي جديدة
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              بصفتك أستاذاً بالكلية، يحق لك حجز حصة عملي وتعيين المخبر المناسب لتدريس الطلاب مع تفصيل التوقيت.
            </p>

            <form onSubmit={handleProfAddSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحصة والمادة التدريسية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ورشة الأمن السيبراني والتحليل الجنائي"
                  value={newSchSubject}
                  onChange={(e) => setNewSchSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المخبر المستهدف للتدريس</label>
                  <select
                    required
                    value={newSchLabId}
                    onChange={(e) => setNewSchLabId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- اختر المخبر الشاغر --</option>
                    {laboratories.map((l) => (
                      <option key={l._id || l.id} value={l._id || l.id}>
                        {l.name} ({l.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التوقيت والحصة المستهدفة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الاثنين 08:30 - 10:00"
                    value={newSchTime}
                    onChange={(e) => setNewSchTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الأستاذ المحاضر (أنت أو زميل آخر)</label>
                <select
                  value={targetProfId}
                  onChange={(e) => setTargetProfId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                >
                  {professors.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} ({p.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('schedules')}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> تأكيد الحجز وإدراج بالجدول
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content 3: labs_equipment */}
        {activeTab === 'labs_equipment' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">استطلاع وتعداد الأجهزة والعتاد</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">البحث المباشر لحالة الأجهزة المتاحة للاستعارة وورشات الدرس.</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ابحث بالعتاد أو المخبر..."
                  value={searchEquipQuery}
                  onChange={(e) => setSearchEquipQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {equipmentList
                .filter((eq) => {
                  if (searchEquipQuery) {
                    const qu = searchEquipQuery.toLowerCase();
                    return (
                      eq.name.toLowerCase().includes(qu) ||
                      eq.laboratoryName.toLowerCase().includes(qu)
                    );
                  }
                  return true;
                })
                .map((eq) => {
                  return (
                    <div key={eq._id || eq.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
                      {/* Image Header with fallback */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-100 border-b border-slate-100">
                        {eq.imageUrl ? (
                          <img
                            src={eq.imageUrl}
                            alt={eq.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <Wrench className="w-6 h-6 text-indigo-400 mb-1" />
                            <span className="text-[10px] text-slate-400">لا يوجد صورة مخصصة</span>
                          </div>
                        )}
                        <span className="absolute top-2 right-2 bg-slate-800/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {eq.laboratoryName}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="p-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-100 flex items-center justify-center">
                              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                eq.validity === 'OK'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                  : eq.validity === 'Needs Maintenance'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                  : 'bg-rose-50 text-rose-800 border border-rose-100'
                              }`}
                            >
                              الحالة: {eq.validity === 'OK' ? 'سليم ومعاير' : eq.validity === 'Needs Maintenance' ? 'بحاجة لصيانة وملائمة' : 'تالف / متوقف'}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800">{eq.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">يتبع لـ: {eq.laboratoryName}</p>
                          </div>
                        </div>

                      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">الأهلية للإعارة الطلابية:</span>
                        <span className={`font-bold ${eq.isBorrowable ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {eq.isBorrowable ? 'مسموح بالاستعارة' : 'للاستخدام الداخلي المخبري فقط'}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

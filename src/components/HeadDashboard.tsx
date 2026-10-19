/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import {
  Layers,
  Wrench,
  BookOpen,
  UserCheck,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Inbox,
  Clock,
  Briefcase,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Laboratory, Professor, StudySchedule, Equipment, Complaint } from '../types';
import NotificationCenter from './NotificationCenter';

interface HeadDashboardProps {
  isDean?: boolean;
  onBack: () => void;
}

export default function HeadDashboard({ isDean = false, onBack }: HeadDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'add_assets' | 'complaints'>('overview');

  // Database lists
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Inputs: Laboratory
  const [labName, setLabName] = useState('');
  const [labDept, setLabDept] = useState('');

  // Form Inputs: Professor
  const [profName, setProfName] = useState('');
  const [profDept, setProfDept] = useState('');

  // Form Inputs: Class Schedule
  const [schSubject, setSchSubject] = useState('');
  const [schProfId, setSchProfId] = useState('');
  const [schLabId, setSchLabId] = useState('');
  const [schTime, setSchTime] = useState('');

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
      '/api/equipment',
      '/api/complaints'
    ];

    Promise.all(endpoints.map((e) => fetch(e).then((r) => r.json())))
      .then(([labs, profs, schs, equips, compls]) => {
        setLaboratories(labs);
        setProfessors(profs);
        setSchedules(schs);
        setEquipmentList(equips);
        setComplaints(compls);
      })
      .catch((err) => showNotification('خطأ في الاتصال ومزامنة البيانات للقسم: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  };

  // 1. Submit Laboratory
  const handleAddLab = (e: FormEvent) => {
    e.preventDefault();
    if (!labName || !labDept) return;

    fetch('/api/laboratories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: labName, department: labDept }),
    })
      .then((res) => res.json())
      .then((newLab) => {
        setLaboratories([...laboratories, newLab]);
        showNotification(`تمت إضافة مخبر علمي بنجاح: ${newLab.name}`, 'success');
        setLabName('');
        setLabDept('');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 2. Submit Professor
  const handleAddProf = (e: FormEvent) => {
    e.preventDefault();
    if (!profName || !profDept) return;

    fetch('/api/professors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profName, department: profDept }),
    })
      .then((res) => res.json())
      .then((newProf) => {
        setProfessors([...professors, newProf]);
        showNotification(`تم تسجيل الأستاذ: ${newProf.name}`, 'success');
        setProfName('');
        setProfDept('');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 3. Submit Study Schedule
  const handleAddSchedule = (e: FormEvent) => {
    e.preventDefault();
    if (!schSubject || !schProfId || !schLabId || !schTime) {
      showNotification('يرجى تعبئة كافة الحقول لبرمجة الجدول الفني', 'error');
      return;
    }

    const profObj = professors.find((p) => (p._id || p.id) === schProfId);
    const labObj = laboratories.find((l) => (l._id || l.id) === schLabId);
    if (!profObj || !labObj) return;

    fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: schSubject,
        professorId: schProfId,
        professorName: profObj.name,
        laboratoryId: schLabId,
        laboratoryName: labObj.name,
        timeSlot: schTime,
      }),
    })
      .then((res) => res.json())
      .then((newSch) => {
        setSchedules([...schedules, newSch]);
        showNotification('تم إدراج الحصة الدراسية وتعيين الأستاذ بنجاح.', 'success');
        setSchSubject('');
        setSchProfId('');
        setSchLabId('');
        setSchTime('');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 4. Handle Complaint Resolution
  const handleResolveComplaint = (complaintId: string) => {
    fetch(`/api/complaints/${complaintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Resolved' }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('فشل تحديث الشكوى');
        return res.json();
      })
      .then((updated) => {
        setComplaints(complaints.map((c) => ((c._id || c.id) === complaintId ? updated : c)));
        showNotification('تم المصادقة على تسوية الشكوى وحلها بنجاح.', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Filter complaints directed specifically to this office
  const filteredComplaints = complaints.filter(
    (c) => c.targetRole === (isDean ? 'Dean' : 'Department Head')
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800" dir="rtl">
      {/* Header */}
      <header
        className={`text-white shadow-md transition-all ${
          isDean
            ? 'bg-gradient-to-l from-rose-800 to-amber-900 border-b border-rose-950'
            : 'bg-gradient-to-l from-violet-700 to-indigo-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-transform hover:-translate-x-1"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {isDean ? 'بوابة وإدارة عميد الكلية ' : 'بوابة رئيس القسم '}
              </h1>
              <p className="text-xs text-indigo-100 mt-1">
                {isDean
                  ? 'رؤية تقارير الكلية العلمية، جرد العتاد المخابر، البت في التظلمات المعروضة له'
                  : 'إضافة مخابر، أساتذة، جدول التدريس والمصادقة على لوجستيات الأجهزة'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="bg-white/10 px-4 py-2 rounded-full border border-white/20 text-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
              {isDean ? 'أمين عمادة الكلية' : 'رئيس القسم '}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Banner Notification */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 border shadow-sm transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Tab row navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            جرد عتاد وصلاحية مخابر القسم
          </button>
          {!isDean && (
            <button
              onClick={() => setActiveTab('add_assets')}
              className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
                activeTab === 'add_assets'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              شؤون التهيئة وإضافة مخبر/أستاذ/جدول
            </button>
          )}
          <button
            onClick={() => setActiveTab('complaints')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all relative ${
              activeTab === 'complaints'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            التقارير وصندوق الشكاوى الموجهة لي
            {filteredComplaints.filter((c) => c.status === 'Pending').length > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold">
                {filteredComplaints.filter((c) => c.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>

        {/* 1. Overview Tab (Laboratories list, sorted equipment with validity) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-400">إجمالي المخابر</span>
                  <span className="text-xl font-extrabold text-slate-800 mt-1 block">{laboratories.length}</span>
                </div>
                <div className="p-3 bg-violet-100 rounded-lg text-violet-700">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-400">عدد الأساتذة بالقسم</span>
                  <span className="text-xl font-extrabold text-slate-800 mt-1 block">{professors.length}</span>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-400">القطع والأجهزة المضافة</span>
                  <span className="text-xl font-extrabold text-slate-800 mt-1 block">{equipmentList.length}</span>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg text-teal-700">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-400">القطع المعطلة / صيانة</span>
                  <span className="text-xl font-extrabold text-rose-700 mt-1 block">
                    {equipmentList.filter((e) => e.validity !== 'OK').length}
                  </span>
                </div>
                <div className="p-3 bg-rose-100 rounded-lg text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* General Equipment validity block sorted by laboratories */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5 animate-pulse">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                لوحة فحص ومطابقة العتاد العلمي (المضاف من مسؤول المخابر)
              </h3>
              <p className="text-xs text-slate-400 mb-6">يسرد هذا الكشف كافة القطع الإلكترونية والمعدات المسجلة وحالة صلاحيتها الفورية والتشغيلية.</p>

              {laboratories.map((lab) => {
                const labEquips = equipmentList.filter((eq) => eq.laboratoryId === (lab._id || lab.id));
                return (
                  <div key={lab._id || lab.id} className="border border-slate-200 rounded-xl mb-6 last:mb-0 overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{lab.name}</h4>
                        <span className="text-[10px] text-slate-500">القسم: {lab.department}</span>
                      </div>
                      <span className="text-xs text-slate-500 mt-2 sm:mt-0 font-medium">قوام العتاد: ({labEquips.length}) قطع مسجلة</span>
                    </div>

                    {labEquips.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">لا يوجد أي تجهيزات أو ملحقات علمية مضافة في هذا المخبر حتى الآن من مسؤولي المخابر.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-white border-b border-slate-100 text-slate-500">
                              <th className="p-3">اسم القطعة</th>
                              <th className="p-3">أهلية الاستعارة الطلابية</th>
                              <th className="p-3 text-center">المعايرة الدورية</th>
                              <th className="p-3 text-center">أهلية وصلاحية العتاد الحالية</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {labEquips.map((eq) => (
                              <tr key={eq._id || eq.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-700">{eq.name}</td>
                                <td className="p-3">
                                  {eq.isBorrowable ? (
                                    <span className="text-emerald-600 font-semibold">مسموح بالخروج (للإعارة)</span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">تجهيز معملي داخلي مغلق</span>
                                  )}
                                </td>
                                <td className="p-3 text-center text-slate-500 font-mono">كل {eq.calibrationInterval} شهراً</td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold ${
                                      eq.validity === 'OK'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : eq.validity === 'Needs Maintenance'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {eq.validity === 'OK'
                                      ? 'سليم وجاهز للاستعمال ✅'
                                      : eq.validity === 'Needs Maintenance'
                                      ? 'تحتاج تدخل (صيانة دورية)'
                                      : 'معدات تالفة تماماً ❌'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Admin operations Tab (Add inputs logic) */}
        {activeTab === 'add_assets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {/* Add Laboratory */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  إضافة مخبر علمي جديد للكلية
                </h3>
                <form onSubmit={handleAddLab} className="space-y-3">
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="مثل: مختبر الشبكات والمحاكاة"
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={labDept}
                    onChange={(e) => setLabDept(e.target.value)}
                    placeholder="القسم (مثال: هندسة البرمجيات)"
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    تأكيد وتسجيل المخبر
                  </button>
                </form>
              </div>

              {/* Add Professor */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  برمجة وإدراج أستاذ محاضر جديد
                </h3>
                <form onSubmit={handleAddProf} className="space-y-3">
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    placeholder="اسم الأستاذ الكامل"
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={profDept}
                    onChange={(e) => setProfDept(e.target.value)}
                    placeholder="القسم التعليمي المعني"
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    تسجيل الأستاذ للقسم
                  </button>
                </form>
              </div>
            </div>

            {/* Scheduling Form Code block */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                تحضير وإدراج الحصص بالجدول الدراسي العام للمخابر
              </h3>
              <p className="text-xs text-slate-400 mb-4">إنشاء وتعيين جدول زمني لكل مخبر وتخصيص أساتذة المادة له برمجياً.</p>

              <form onSubmit={handleAddSchedule} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">اسم الحصة والمضمون التدريسي</label>
                  <input
                    type="text"
                    value={schSubject}
                    onChange={(e) => setSchSubject(e.target.value)}
                    placeholder="مثال: ورشة أنظمة موازية وحوسبة"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تداول التوقيت والمواعيد</label>
                  <input
                    type="text"
                    value={schTime}
                    onChange={(e) => setSchTime(e.target.value)}
                    placeholder="الاثنين 13:00 - 15:00"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تنسيب الأستاذ المشرف</label>
                  <select
                    value={schProfId}
                    onChange={(e) => setSchProfId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- اختر أستاذاً --</option>
                    {professors.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">المخبر المحتضن للتمرين</label>
                  <select
                    value={schLabId}
                    onChange={(e) => setSchLabId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- اختر مخبراً من القسم --</option>
                    {laboratories.map((l) => (
                      <option key={l._id || l.id} value={l._id || l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    تثبيت إتاحة وبث الحصة بالجدول الدراسي
                  </button>
                </div>
              </form>

              {/* Schedules display table */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="font-bold text-xs text-slate-600 mb-4">الجدول الدراسي المنشور والمجدول حالياً:</h4>
                <div className="space-y-3">
                  {schedules.map((sch) => (
                    <div key={sch._id || sch.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-800 block text-xs">{sch.subject}</strong>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          الأستاذ: <strong className="text-slate-600">{sch.professorName}</strong> | المكان: <strong className="text-slate-600">{sch.laboratoryName}</strong>
                        </span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-[10px] font-bold font-mono">
                        {sch.timeSlot}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Complaints box (Filtered based on Dean vs Dept Head) */}
        {activeTab === 'complaints' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-2">
              صندوق تظلمات وتقارير {isDean ? 'الأمانة وعرائض عميد الكلية' : 'رئاسة القسم '}
            </h3>
            <p className="text-xs text-slate-400 mb-6">قائمة للشكاوى والبلاغات الموجهة لمكتبكم للتنظيم  أو التظلم لسلامة العمل بالمخابر.</p>

            {filteredComplaints.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 text-slate-400 rounded-xl border border-dashed">
                لا توجد شكاوى أو بلاغات مسجلة موجهة إليكم حالياً في صندوق الوارد.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((c) => (
                  <div
                    key={c._id || c.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <strong className="text-sm text-slate-800">{c.studentName}</strong>
                        <span className="text-slate-300">|</span>
                        <span className="text-[11px] text-slate-400 font-mono">تاريخ التقديم: {c.requestedDate}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 mt-2">
                        {c.message}
                      </p>
                    </div>
                    <div className="flex-shrink-0 self-end sm:self-start">
                      {c.status === 'Pending' ? (
                        <button
                          onClick={() => handleResolveComplaint(c._id || c.id || '')}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm"
                        >
                          تأكيد تسوية الطلب
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> تمت التسوية وحل العريضة
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

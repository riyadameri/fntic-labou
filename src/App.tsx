/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  FlaskConical,
  Briefcase,
  Users,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Info,
  BookOpen,
  Tv
} from 'lucide-react';
import StudentDashboard from './components/StudentDashboard';
import LabDashboard from './components/LabDashboard';
import HeadDashboard from './components/HeadDashboard';
import ProfDashboard from './components/ProfDashboard';
import TvDisplayDashboard from './components/TvDisplayDashboard';
import StatusIndicator from './components/StatusIndicator';
import { EquipmentScannerPortal } from './components/EquipmentQRHelper';
import { QrCode } from 'lucide-react';

type Role = 'home' | 'student' | 'head' | 'dean' | 'lab' | 'secgen' | 'professor' | 'tv' | 'scan';

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('home');

  // Monitor path changes for multi-path simulation
  useEffect(() => {
    const handleLocationChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const isScan = searchParams.get('scan');
      const path = window.location.pathname;
      
      if (isScan || path.includes('scan')) {
        setCurrentRole('scan');
      } else if (path.includes('student')) {
        setCurrentRole('student');
      } else if (path.includes('head')) {
        setCurrentRole('head');
      } else if (path.includes('dean')) {
        setCurrentRole('dean');
      } else if (path.includes('lab')) {
        setCurrentRole('lab');
      } else if (path.includes('secgen')) {
        setCurrentRole('secgen');
      } else if (path.includes('professor')) {
        setCurrentRole('professor');
      } else if (path.includes('tv')) {
        setCurrentRole('tv');
      } else {
        setCurrentRole('home');
      }
    };

    // Run on initial load
    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToRole = (role: Role) => {
    setCurrentRole(role);
    const path = role === 'home' ? '/' : `/${role}`;
    window.history.pushState(null, '', path);
  };

  const renderCurrentView = () => {
    switch (currentRole) {
      case 'student':
        return <StudentDashboard onBack={() => navigateToRole('home')} />;
      case 'head':
        return <HeadDashboard isDean={false} onBack={() => navigateToRole('home')} />;
      case 'dean':
        return <HeadDashboard isDean={true} onBack={() => navigateToRole('home')} />;
      case 'lab':
        return <LabDashboard isSecGen={false} onBack={() => navigateToRole('home')} />;
      case 'secgen':
        return <LabDashboard isSecGen={true} onBack={() => navigateToRole('home')} />;
      case 'professor':
        return <ProfDashboard onBack={() => navigateToRole('home')} />;
      case 'tv':
        return <TvDisplayDashboard onBack={() => navigateToRole('home')} />;
      case 'scan':
        return <EquipmentScannerPortal onBack={() => navigateToRole('home')} />;
      case 'home':
      default:
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800" dir="rtl">
            {/* Jumbotron section updated with clean university branding */}
            <div className="text-center py-10 px-4 shadow-xs border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
              {/* Abstract decorative accent backgrounds */}
              <div className="absolute top-0 left-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl"></div>

              <div className="max-w-3xl mx-auto space-y-3.5">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <span className="text-xs font-black text-indigo-700 tracking-wider">جامعة قاصدي مرباح ورقلة</span>
                  <span className="text-xs font-bold text-slate-500">كلية التكنولوجيا الحديثة للمعلومات والاتصال</span>
                </div>
                
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  نظام إدارة المخابر
                </h1>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold font-mono border border-indigo-100">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> نمط تجريبي كامل متاح للزوار (Demo Mode)
                  </span>
                </div>
              </div>
            </div>

            {/* Launchers Grid */}
            <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center space-y-6">
              <div className="text-center">
                <h2 className="text-base font-black text-slate-800">بوابة الاختصار والولوج المباشر لأدوار الكلية</h2>
                <p className="text-xs text-slate-405 mt-1">تتميز الأدوار بصلاحيات لوجستية وتنسيب فني متكامل</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Dean Card */}
                <button
                  onClick={() => navigateToRole('dean')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-400 text-right group transition-all flex flex-col justify-between h-48"
                >
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-50 text-rose-700 w-fit rounded-xl group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">عميد الكلية</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        الاطلاع المباشر على تقارير العتاد وبطاقة الجودة ISO، وتظلمات الطلاب العاجلة للعمادة.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1 self-start group-hover:-translate-x-1 transition-transform">
                    دخول المنصة <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* 2. Department Head Card */}
                <button
                  onClick={() => navigateToRole('head')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-500 text-right group transition-all flex flex-col justify-between h-48"
                >
                  <div className="space-y-3">
                    <div className="p-3 bg-violet-50 text-violet-700 w-fit rounded-xl group-hover:scale-110 transition-transform">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">رئيس القسم</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        برمجة الحصص الدراسية، تسجيل الأساتذة بجدول المخابر، ومطابقة العتاد وصلاحيات الأقسام.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-violet-700 flex items-center gap-1 self-start group-hover:-translate-x-1 transition-transform">
                    دخول المنصة <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* 3. Secretary General Card */}
                <button
                  onClick={() => navigateToRole('secgen')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-500 text-right group transition-all flex flex-col justify-between h-48"
                >
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-100 text-slate-700 w-fit rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">الأمين العام</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        فحص سجلات الجودة الأكاديمية وحصص التدريس، ومتابعة ميزانية العتاد وقوافل الشكاوى اللوجستية.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 self-start group-hover:-translate-x-1 transition-transform">
                    دخول المنصة <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* 4. Lab Supervisor Card */}
                <button
                  onClick={() => navigateToRole('lab')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 text-right group transition-all flex flex-col justify-between h-48"
                >
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 text-blue-700 w-fit rounded-xl group-hover:scale-110 transition-transform">
                      <FlaskConical className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">مسؤول المخابر</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        إدراج عتاد جديد، جدولة المعايرة التلقائية، إعارة الأقسام، وبطاقات RFID الذكية للأساتذة.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1 self-start group-hover:-translate-x-1 transition-transform">
                    دخول المنصة <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* 5. Professor Card */}
                <button
                  onClick={() => navigateToRole('professor')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 text-right group transition-all flex flex-col justify-between h-48"
                >
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-50 text-indigo-700 w-fit rounded-xl group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">الأستاذ المحاضر</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        عرض تفاصيل الحصص، جدولة حصة جديدة، ومتابعة عتاد المعامل وقابلية إعارتها الفورية.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1 self-start group-hover:-translate-x-1 transition-transform">
                    دخول المنصة <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* 6. Student Card */}
                <button
                  onClick={() => navigateToRole('student')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 text-right group transition-all flex flex-col justify-between h-48"
                >
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 w-fit rounded-xl group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">بوابة وحساب الطالب</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        عرض الجداول للمجموعات، استعارة عتاد مأذون فوتغرافي حقيقي، وتوجيه تظلمات وبلاغات معطلة.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 self-start group-hover:-translate-x-1 transition-transform">
                    دخول المنصة <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* 7. QR Scanner Portal Card */}
                <button
                  onClick={() => navigateToRole('scan')}
                  className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 rounded-2xl border border-indigo-700/30 shadow-sm hover:shadow-lg hover:border-indigo-400 text-right group transition-all flex flex-col justify-between h-48 text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
                  <div className="space-y-3 relative z-10">
                    <div className="p-3 bg-indigo-500/20 text-indigo-300 w-fit rounded-xl group-hover:scale-110 transition-transform">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm text-white">ماسح الاستجابة السريعة (QR)</h3>
                        <span className="bg-emerald-500 text-slate-950 text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">جديد</span>
                      </div>
                      <p className="text-[11px] text-indigo-250 mt-1 leading-relaxed">
                        رابط المسح بكاميرا الهاتف للتحقق المباشر من حالة الأجهزة وإصدار بلاغات الصيانة واستعارتها الفورية.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1 self-start group-hover:-translate-x-1 transition-transform relative z-10">
                    تشغيل الكاميرا والمسح <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* 7. New TV Display screen for hallway televisions */}
                <button
                  onClick={() => navigateToRole('tv')}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md hover:shadow-xl hover:border-indigo-400 text-right group transition-all flex flex-col justify-between h-48 col-span-1 md:col-span-2 lg:col-span-3 text-white"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-300 rounded-xl">
                          <Tv className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black bg-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-300">
                          بث روتيني فوري / TV Screen Link
                        </span>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white">جدول العرض للشاشة التلفزيونية بالممرات (Display Hall TV)</h3>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xl leading-relaxed">
                          شاشة عرض مخصصة للتحميل المباشر على أجهزة التلفزيون المعلقة في ممرات ومداخل الكلية لعرض الحصص النشطة، تنبيهات الطوارئ، وحالة إشغال المخابر والأجهزة.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl flex items-center gap-1 self-center sm:self-auto hover:bg-emerald-400 transition-colors">
                      تشغيل البث للتلفزيون <ChevronLeft className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              </div>

              {/* Path Routing Notice */}
              <div className="mt-8 p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex items-start gap-2.5 max-w-xl mx-auto">
                <Info className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-orange-850/80 leading-relaxed font-sans">
                  <strong>تنبيه مسارات الملفات (Specific Paths):</strong> يدعم البرنامج الولوج للواجهات عبر باثات مخصصة بفضل تكامل مسارات الباك أند والفرونت أند. على سبيل المثال: استخدام الرابط المستقل للطلاب عبر المسار <code className="bg-orange-100 px-1 py-0.5 rounded font-mono text-rose-700">/student</code> أو الأستاذ عبر <code className="bg-orange-100 px-1 py-0.5 rounded font-mono text-rose-700">/professor</code> أو شاشة التلفزيون عبر <code className="bg-orange-100 px-1 py-0.5 rounded font-mono text-rose-700">/tv</code> وهو ما يعادل استدعاء صفحة العرض المخصصة.
                </p>
              </div>
            </main>

            {/* Micro Database status and general footer */}
            <StatusIndicator />
          </div>
        );
    }
  };

  return renderCurrentView();
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Printer, 
  X, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Copy, 
  Clock, 
  Sparkles, 
  ExternalLink,
  ChevronLeft,
  Wrench,
  BookOpen,
  Send,
  UserCheck
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Equipment } from '../types';

interface EquipmentQRButtonProps {
  equipment: Equipment;
}

/**
 * Renders a compact button to view/generate QR Code for the specific equipment.
 */
export function EquipmentQRButton({ equipment }: EquipmentQRButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const eqId = equipment._id || equipment.id || '';
  // Formulate the redirect URL that scanning this QR code will load
  // Pointing to current origin with proper scan parameter
  const scanLink = `${window.location.origin}${window.location.pathname}?scan=${eqId}`;

  useEffect(() => {
    if (isOpen && eqId) {
      QRCode.toDataURL(scanLink, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff'
        }
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('Failed to generate high-quality QR code:', err));
    }
  }, [isOpen, eqId, scanLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_${equipment.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const printWindow = window.open(windowUrl, `_blank`, `left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0`);
    
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>بطاقة تعريف وتعريف العتاد - جامعة ورقلة</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 40px;
                background-color: #ffffff;
                color: #000000;
                text-align: center;
              }
              .card {
                border: 4px solid #0f172a;
                border-radius: 24px;
                padding: 30px;
                max-width: 480px;
                margin: 0 auto;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              }
              .univ-title {
                font-size: 14px;
                font-weight: 800;
                color: #4f46e5;
                margin-bottom: 2px;
                text-transform: uppercase;
              }
              .univ-sub {
                font-size: 11px;
                color: #64748b;
                margin-bottom: 20px;
              }
              .qr-image {
                width: 250px;
                height: 250px;
                margin: 15px auto;
                display: block;
              }
              .eq-name {
                font-size: 22px;
                font-weight: 900;
                color: #0f172a;
                margin: 10px 0 5px 0;
              }
              .lab-name {
                font-size: 14px;
                color: #4b5563;
                background-color: #f3f4f6;
                padding: 6px 12px;
                border-radius: 9999px;
                display: inline-block;
                margin-bottom: 15px;
              }
              .instruction {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 25px;
                border-top: 1px dashed #e5e7eb;
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="univ-title">جامعة قاصدي مرباح ورقلة</div>
              <div class="univ-sub">كلية التكنولوجيا الحديثة للمعلومات والاتصال</div>
              <img class="qr-image" src="${qrUrl}" alt="Device QR Code" />
              <div class="eq-name">${equipment.name}</div>
              <div class="lab-name">الموضع: ${equipment.laboratoryName}</div>
              <div class="instruction">امسح الرمز ضوئياً عبر الكاميرا للتبليغ التلقائي عن صيانة أو بدء حجز فوري</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
        title="إنشاء رمز استجابة سريعة QR فريد"
      >
        <QrCode className="w-3.5 h-3.5" />
        رمز QR
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[150] p-4 text-right" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-slate-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="font-extrabold text-xs">مستند استجابة سريعة فريد</h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">رمز باركود للتتبع والمعاينة وصيانة القطعة</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Presenter Card */}
            <div className="p-5 flex flex-col items-center justify-center text-center">
              <div 
                ref={printRef}
                className="bg-white border-2 border-slate-900 p-4 rounded-2xl w-full shadow-xs flex flex-col items-center"
              >
                <span className="text-[10px] font-black tracking-wider text-indigo-600 block mb-0.5">جامعة قاصدي مرباح ورقلة</span>
                <span className="text-[8px] text-slate-400 block mb-3 font-medium">كلية التكنولوجيا الحديثة</span>
                
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code" className="w-48 h-48 block bg-white object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-400 font-medium animate-pulse">جاري التحميل...</span>
                  </div>
                )}

                <h5 className="font-black text-slate-800 text-sm mt-3 leading-tight">{equipment.name}</h5>
                <span className="inline-block mt-1 bg-slate-100 text-slate-700 font-bold text-[9.5px] px-2.5 py-0.5 rounded-full">
                  الموضع: {equipment.laboratoryName}
                </span>

                <div className="w-full mt-4 border-t border-dashed border-slate-200 pt-3">
                  <span className="text-[10px] text-slate-400 leading-normal block">
                    امسح هذا الرمز عبر كاميرا الجوال للوصول السريع لواجهة Check-In الفورية والإبلاغ عن الأعطال.
                  </span>
                </div>
              </div>

              {/* Utility Tools Grid */}
              <div className="grid grid-cols-3 gap-2 w-full mt-4">
                <button
                  onClick={handleDownload}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2 px-1 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  تحميل PNG
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2 px-1 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  طباعة كرتية
                </button>
                <button
                  onClick={handleCopyLink}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2 px-1 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500 animate-bounce" />
                      <span className="text-[10px] text-emerald-600 font-black">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      نسخ الرابط
                    </>
                  )}
                </button>
              </div>

              {/* Simulation Testing Link option */}
              <div className="w-full mt-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 text-center">
                <p className="text-[9.5px] text-indigo-900 leading-normal font-medium">
                  لتجربة ميزة المسح على نفس الجهاز دون طباعة: 
                  <a
                    href={scanLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-indigo-700 font-black underline mr-1 hover:text-indigo-900"
                  >
                    افتح رابط المسح المباشر <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// --- QR SCANNER PORTAL OVERLAY CONTAINER ---

interface EquipmentScannerPortalProps {
  onBack?: () => void;
}

/**
 * Handles the complete mobile scan simulation workflow:
 * - Direct URL parameter monitoring (?scan=eqId)
 * - Integrated HTML5 Scanner with active camera webcam stream
 * - Manual search backup
 * - Real check-in and instantaneous maintenance/fault reporting dialog
 */
export function EquipmentScannerPortal({ onBack }: EquipmentScannerPortalProps) {
  const [scannedId, setScannedId] = useState<string>('');
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [showScannerComponent, setShowScannerComponent] = useState(false);

  // Maintenance reporting state
  const [reportingFault, setReportingFault] = useState(false);
  const [faultType, setFaultType] = useState<'Needs Maintenance' | 'Damaged'>('Needs Maintenance');
  const [faultMessage, setFaultMessage] = useState('');
  const [complainerName, setComplainerName] = useState('');
  const [isDoneReporting, setIsDoneReporting] = useState(false);

  // Student borrowing state
  const [borrowing, setBorrowing] = useState(false);
  const [borrowStudentName, setBorrowStudentName] = useState('');
  const [borrowLabName, setBorrowLabName] = useState('');
  const [isDoneBorrowing, setIsDoneBorrowing] = useState(false);

  // State of all equipment to assist search and instant mockup selection
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);

  // Monitor scan argument from the URL search params (?scan=eq_id)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanParam = params.get('scan');
    if (scanParam) {
      setScannedId(scanParam);
      fetchEquipmentDetails(scanParam);
    }

    // Capture list of all equipments for backup selection
    fetch('/api/equipment')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllEquipments(data);
      })
      .catch((err) => console.error('Error listing equipments:', err));
  }, []);

  const fetchEquipmentDetails = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setScanMessage('');
    try {
      const resp = await fetch(`/api/equipment`);
      const list = await resp.json();
      if (Array.isArray(list)) {
        const found = list.find((e) => (e._id || e.id) === id);
        if (found) {
          setEquipment(found);
          setBorrowLabName(found.laboratoryName);
        } else {
          setScanMessage('⚠️ لم يتم العثور على أي قطعة مطابقة لهذا الباركود في النظام.');
        }
      }
    } catch (err) {
      console.error(err);
      setScanMessage('⚠️ تعذر الاتصال بالخادم للتحقق من هوية الجهاز.');
    } finally {
      setLoading(false);
    }
  };

  // Setup the html5-qrcode camera scanner
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const startCameraScanner = () => {
    setShowScannerComponent(true);
    setCameraActive(true);
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-camera-element-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scannerRef.current = scanner;
        
        scanner.render(
          (decodedText) => {
            // Check if it's a URL or direct ID
            let matchId = decodedText;
            if (decodedText.includes('?scan=')) {
              const url = new URL(decodedText);
              matchId = url.searchParams.get('scan') || decodedText;
            }
            // Stop scanner
            scanner.clear().catch(e => console.error(e));
            setCameraActive(false);
            setShowScannerComponent(false);
            
            // Handle matched equipment
            setScannedId(matchId);
            fetchEquipmentDetails(matchId);
          },
          (errorMessage) => {
            // silent scanner warnings
          }
        );
      } catch (e) {
        console.error('Failed to initialize webcam:', e);
        setScanMessage('⚠️ لا يمكن تفعيل الكاميرا. يرجى التحقق من أذونات المتصفح أو ارفع صورة للكود.');
      }
    }, 100);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
        .then(() => {
          setCameraActive(false);
          setShowScannerComponent(false);
        })
        .catch(err => {
          console.error(err);
          setCameraActive(false);
          setShowScannerComponent(false);
        });
    } else {
      setCameraActive(false);
      setShowScannerComponent(false);
    }
  };

  // Submit quick maintenance report straight from mobile scan
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment || !complainerName || !faultMessage) return;

    try {
      // 1. Update equipment validity status in DB
      const patchResp = await fetch(`/api/equipment/${equipment._id || equipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validity: faultType })
      });

      // 2. Insert complaint description
      const complaintBody = {
        studentName: complainerName,
        labId: equipment.laboratoryId,
        labName: equipment.laboratoryName,
        equipmentName: equipment.name,
        subject: `بلاغ أعطال عاجل للعتاد عبر رمز QR: ${equipment.name}`,
        complaintText: `تم مسح كود الاستجابة السريعة (QR) الخاص بالجهاز والإرسال الفوري لخلل مصنف كـ [${faultType === 'Damaged' ? 'عطل وتلف معطل' : 'صيانة وتفتيش دوري'}]. التفاصيل: ${faultMessage}`,
        date: new Date().toLocaleDateString('ar-DZ')
      };

      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintBody)
      });

      setIsDoneReporting(true);
      // Refresh current display state
      const updated = { ...equipment, validity: faultType };
      setEquipment(updated);
    } catch (err) {
      console.error('Reporting fault error:', err);
    }
  };

  // Submit check-in / student instant borrow on the scan spot
  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment || !borrowStudentName) return;

    try {
      const borrowBody = {
        studentName: borrowStudentName,
        equipmentId: equipment._id || equipment.id,
        equipmentName: equipment.name,
        laboratoryName: equipment.laboratoryName,
        requestedDate: new Date().toLocaleString('ar-DZ')
      };

      await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(borrowBody)
      });

      setIsDoneBorrowing(true);
    } catch (err) {
      console.error('Borrow request submission failed:', err);
    }
  };

  // Wipe url scan param to go back cleanly
  const handleClearUrlParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('scan');
    window.history.pushState(null, '', url.pathname);
    setScannedId('');
    setEquipment(null);
    setScanMessage('');
    setIsDoneReporting(false);
    setIsDoneBorrowing(false);
    setReportingFault(false);
    setBorrowing(false);
  };

  return (
    <div className="font-sans text-right" dir="rtl">
      {/* Container Wrapper */}
      <div className="bg-slate-50 min-h-screen pb-16">
        {/* Navigation Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <QrCode className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="font-black text-xs text-slate-900">بوابة مسح ورمز المخابر العلمي</h1>
              <span className="text-[10px] text-slate-400 block mt-0.5">اتصال كاميرا فوري وتقديم تقارير ضبط وصيانة</span>
            </div>
          </div>
          
          {onBack && (
            <button
              onClick={() => {
                handleClearUrlParam();
                onBack();
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              الرجوع للرئيسية
            </button>
          )}
        </div>

        <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 mt-3">
          {/* Main Action Area: Camera Scanner Starter */}
          {!equipment && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-3 py-1 rounded-full">
                  🛡️ نظام المسح المعتمد - جامعة ورقلة
                </span>
                <h2 className="text-lg font-black text-slate-900">امسح كود الاستجابة السريعة للقطعة</h2>
                <p className="text-xs text-slate-400 leading-normal">
                  سيوفر لك هذا النظام وصولاً مباشراً إلى تفاصيل الجهاز أو العتاد المتواجد أمامك بالمخبر لطلب استعارته فوراً، أو لإصدار تذكرة صيانة للخلل دون مغادرة الكوريدور.
                </p>
              </div>

              {/* Real Camera Video Output */}
              {showScannerComponent && (
                <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-2 bg-slate-50 relative overflow-hidden">
                  <div id="qr-camera-element-reader" className="w-full h-auto overflow-hidden rounded-xl" />
                  <button
                    onClick={stopCameraScanner}
                    className="absolute top-4 left-4 bg-red-600 hover:bg-red-750 text-white font-bold p-1 rounded-full text-xs shadow-md z-10 transition-colors"
                    title="الغاء"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-center p-2 text-[9px] text-indigo-600 font-semibold animate-pulse">
                    🎥 جاري فتح تغذية الكاميرا للمطابقة الحية...
                  </div>
                </div>
              )}

              {/* Trigger Buttons */}
              {!cameraActive && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startCameraScanner}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    تفعيل ماسح الكاميرا الفوري
                  </button>

                  <div className="relative flex py-3 items-center justify-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-bold">نمذجة وفحص تجريبي سريع</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  {/* Manual selection bypass for easier evaluation in iframe */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-650 mb-1">اختر عتاداً لمحاكاة عملية المسح السريع:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allEquipments.slice(0, 4).map((eq) => (
                        <button
                          key={eq._id || eq.id}
                          onClick={() => {
                            const id = eq._id || eq.id || '';
                            setScannedId(id);
                            fetchEquipmentDetails(id);
                          }}
                          className="bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 p-2.5 rounded-xl text-right text-xs transition-all flex items-center gap-2 group"
                        >
                          <div className="p-1.5 bg-indigo-200/40 rounded-lg text-indigo-750 group-hover:scale-110 transition-transform">
                            📦
                          </div>
                          <div className="truncate flex-1">
                            <span className="font-bold text-[11.5px] text-slate-800 block">{eq.name}</span>
                            <span className="text-[9.5px] text-slate-400 block mt-0.5 truncate">{eq.laboratoryName}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {scanMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-900 leading-normal animate-shake">
                  {scanMessage}
                </div>
              )}
            </div>
          )}

          {/* Active Equipment Mobile Hub */}
          {equipment && (
            <div className="space-y-4">
              {/* Main Info Card */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
                <div className="h-44 w-full relative bg-slate-900 border-b border-slate-100">
                  {equipment.imageUrl ? (
                    <img src={equipment.imageUrl} alt={equipment.name} className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-indigo-950 to-slate-900">
                      <QrCode className="w-12 h-12 text-indigo-400/50 mb-2 animate-pulse" />
                      <span className="text-[11px] text-white/40 font-bold">لا يوجد صورة ملحقة بالبطاقة</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <span className={`absolute top-4 right-4 text-[10px] font-black px-3 py-1 rounded-full text-white shadow-lg ${
                    equipment.validity === 'OK'
                      ? 'bg-emerald-600/90'
                      : equipment.validity === 'Needs Maintenance'
                      ? 'bg-amber-500/90'
                      : 'bg-rose-600/90'
                  }`}>
                    {equipment.validity === 'OK' ? 'سليم وجاهز' : equipment.validity === 'Needs Maintenance' ? 'صيانة دورية عاجلة' : 'تالف / متوقف'}
                  </span>

                  <span className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white font-bold text-[10px] px-3 py-1 rounded-xl">
                    موضع: {equipment.laboratoryName}
                  </span>
                </div>

                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{equipment.name}</h3>
                    <p className="text-[10.5px] text-slate-400 mt-1">المعرف التعريفي للعتاد في سيرفرات الكلية: <code className="bg-slate-100 font-mono px-1.5 py-0.5 rounded text-[9.5px] text-rose-600 font-black">{equipment._id || equipment.id}</code></p>
                  </div>

                  {/* Core specs table info */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-450 block font-bold">قابلية الإعارة للطلاب</span>
                      <span className={`font-black uppercase text-[11.5px] block mt-1 ${equipment.isBorrowable ? 'text-emerald-700' : 'text-slate-450'}`}>
                        {equipment.isBorrowable ? '✓ متاح للاستعارة' : '✕ استعمال مخبري داخلي'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-450 block font-bold">دورة المعايرة الدورية</span>
                      <span className="font-sans text-[11px] font-bold text-slate-700 block mt-1">
                        كل {equipment.calibrationInterval} أشهر
                      </span>
                    </div>
                  </div>

                  {/* Scan Back Controller */}
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={handleClearUrlParam}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg text-center"
                    >
                      مسح جهاز آخر
                    </button>
                    {equipment.isBorrowable && !reportingFault && !borrowing && (
                      <button
                        onClick={() => {
                          setBorrowing(true);
                          setReportingFault(false);
                        }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm"
                      >
                        طلب استعارة سريعة
                      </button>
                    )}
                    {!reportingFault && !borrowing && (
                      <button
                        onClick={() => {
                          setReportingFault(true);
                          setBorrowing(false);
                        }}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-lg"
                      >
                        التبليغ عن خلل / صيانة
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Form Blocks inside scanned frame perspective */}
              
              {/* A. QUICK BORROW CONTAINER */}
              {borrowing && (
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">طلب حجز واستعارة فورية على البقعة</h4>
                    </div>
                    <button onClick={() => setBorrowing(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isDoneBorrowing ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center space-y-2">
                      <p className="text-xs font-black">✓ تم تسجيل طلب الاستعارة بنجاح!</p>
                      <p className="text-[10px] leading-relaxed text-emerald-800">
                        سيرسل طلبك لصفحة مسؤول المخابر ليمنحك الموافقة الفورية بناءً على قراءة الهوية. يرجى توجيه طلب RFID والتقاط القطعة.
                      </p>
                      <button
                        onClick={() => {
                          setIsDoneBorrowing(false);
                          setBorrowing(false);
                          setBorrowStudentName('');
                        }}
                        className="mt-2 text-[10px] bg-white border border-emerald-300 text-emerald-700 px-3 py-1 rounded"
                      >
                        تم
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleBorrowSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطالب المستعير بالكامل:</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: يونس بن مسعود"
                          value={borrowStudentName}
                          onChange={(e) => setBorrowStudentName(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">المخبر التابع له لتثبيت العملية:</label>
                        <input
                          type="text"
                          readOnly
                          value={borrowLabName}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-450 cursor-not-allowed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
                      >
                        إرسال الطلب الفوري لمسؤول المخابر
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* B. FAULT REPORT / COMPLAINT CONTAINER */}
              {reportingFault && (
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">التبليغ المباشر والربط مع نظام الصيانة</h4>
                    </div>
                    <button onClick={() => setReportingFault(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isDoneReporting ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center space-y-2">
                      <p className="text-xs font-black">✓ تم تلقي تقرير الأعطال وتحويله لغرفة الصيانة والمسؤولين!</p>
                      <p className="text-[10px] leading-relaxed text-emerald-800">
                        جرى إحباط عتاد القطعة ووسمه تلقائياً كـ [{faultType === 'Damaged' ? 'تالف كلي' : 'بحاجة لصيانة عاجلة'}] على قاعدة البيانات. سيقوم مركز التنبيهات بتسريب الإشعار فوراً في صفحة أمين عمادة الكلية ومن يهمه الأمر لجدولة الصيانة.
                      </p>
                      <button
                        onClick={() => {
                          setIsDoneReporting(false);
                          setReportingFault(false);
                          setComplainerName('');
                          setFaultMessage('');
                        }}
                        className="mt-2 text-[10px] bg-white border border-emerald-300 text-emerald-700 px-3 py-1 rounded font-bold"
                      >
                        حسناً
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل للمبلّع:</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: د. كمال دريسي / أو الطالب فلان"
                          value={complainerName}
                          onChange={(e) => setComplainerName(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                          faultType === 'Needs Maintenance' 
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="faultType"
                            value="Needs Maintenance"
                            checked={faultType === 'Needs Maintenance'}
                            onChange={() => setFaultType('Needs Maintenance')}
                            className="text-amber-600"
                          />
                          <div className="text-right">
                            <span className="text-xs block">صيانة وتعديل</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">يعمل لكن بجودة أقل</span>
                          </div>
                        </label>

                        <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                          faultType === 'Damaged' 
                            ? 'bg-rose-50 border-rose-300 text-rose-900 font-extrabold' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="faultType"
                            value="Damaged"
                            checked={faultType === 'Damaged'}
                            onChange={() => setFaultType('Damaged')}
                            className="text-rose-600"
                          />
                          <div className="text-right">
                            <span className="text-xs block">تالف ومتوقف كلياً</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">تعطل كلي يمنع الاستخدام</span>
                          </div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">تقرير الخلل الفني وملاحظات العيب:</label>
                        <textarea
                          required
                          placeholder="صف لنا بالتفصيل الجزء المتعطل لمنع تكرار الخطأ وتسهيل تأمين معدات الاستبدال..."
                          rows={3}
                          value={faultMessage}
                          onChange={(e) => setFaultMessage(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-rose-650 hover:bg-rose-750 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        إرسال البلاغ الفوري للأمانة العامة ورئيس القسم
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

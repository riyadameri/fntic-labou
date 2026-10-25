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
  X,
  Plus,
  ArrowRight,
  Sparkles,
  Inbox,
  Clock,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Settings,
  Wifi,
  Cpu,
  Lock,
  Unlock,
  Key,
  Globe
} from 'lucide-react';
import { Laboratory, Professor, StudySchedule, Equipment, BorrowRequest, Complaint, RfidCard, InstalledSoftware } from '../types';
import NotificationCenter from './NotificationCenter';
import { EquipmentQRButton } from './EquipmentQRHelper';

interface LabDashboardProps {
  isSecGen?: boolean;
  onBack: () => void;
}

export default function LabDashboard({ isSecGen = false, onBack }: LabDashboardProps) {
  const [activeTab, setActiveTab] = useState<'labs_profs' | 'equip' | 'iso_quality' | 'borrow' | 'complaints' | 'settings'>('labs_profs');
  const [qualitySubTab, setQualitySubTab] = useState<'preventive' | 'curative'>('preventive');

  // Hardware Config & Lock Simulation States
  const [raspberryPiIp, setRaspberryPiIp] = useState('192.168.1.100');
  const [esp32Ip, setEsp32Ip] = useState('192.168.1.101');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [simSelectedLab, setSimSelectedLab] = useState('');
  const [simCardCode, setSimCardCode] = useState('');
  const [simLog, setSimLog] = useState<string[]>([]);
  const [lockStatus, setLockStatus] = useState<'locked' | 'unlocking' | 'unlocked'>('locked');

  // Domain & Port System Info States (Port 4040 & https://rudeox.cloud)
  const [systemInfo, setSystemInfo] = useState<{
    primaryPort: number;
    activePorts: number[];
    configuredDomain: string;
    currentHost?: string;
    isRudeoxDomain?: boolean;
    corsEnabled?: boolean;
  } | null>(null);
  const [checkingSystemInfo, setCheckingSystemInfo] = useState(false);
  const [copyNginxSuccess, setCopyNginxSuccess] = useState(false);

  const checkSystemDomainInfo = () => {
    setCheckingSystemInfo(true);
    fetch('/api/system-info')
      .then((res) => res.json())
      .then((data) => setSystemInfo(data))
      .catch((err) => console.error('Error checking system info:', err))
      .finally(() => setCheckingSystemInfo(false));
  };

  // Database lists
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [rfidCards, setRfidCards] = useState<RfidCard[]>([]);
  const [softwareList, setSoftwareList] = useState<InstalledSoftware[]>([]);

  // Form Inputs: Curative Maintenance (الصيانة العلاجية)
  const [mntEqId, setMntEqId] = useState('');
  const [mntEngineer, setMntEngineer] = useState('');
  const [mntAction, setMntAction] = useState('');
  const [mntDate, setMntDate] = useState('');
  const [mntNotes, setMntNotes] = useState('');

  // Local persistent state for curative reports logs
  const [curativeLogs, setCurativeLogs] = useState<{
    id: string;
    equipmentName: string;
    laboratoryName: string;
    engineer: string;
    action: string;
    date: string;
    notes?: string;
  }[]>([
    {
      id: 'mnt-1',
      equipmentName: 'جهاز الأوسيلوسكوب الرقمي DS1054Z',
      laboratoryName: 'مخبر الإلكترونيات المتقدمة (Advanced Electronics)',
      engineer: 'مروان بوضياف',
      action: 'استبدال مكثفات الطاقة التالفة وإعادة لحام مداخل الموجات وجهاز الإشارة الكلية',
      date: '2026-06-05',
      notes: 'تمت الصيانة العلاجية بنجاح واستعاد الجهاز دقته التشغيلية بنسبة 100% وسمي كوسم آمن.'
    },
    {
      id: 'mnt-2',
      equipmentName: 'جهاز راسم الاهتزاز المهبطي الفاخر',
      laboratoryName: 'مخبر طاقة الشبكات والمحاكاة الذكية',
      engineer: 'مهندس بلال حميدي',
      action: 'إعادة ترحيل الأقسام وتعديل الحماية العلاجية للوحات المفاتيح والفيوز المنصهر',
      date: '2026-06-08',
      notes: 'تمت الصيانة التشغيلية وتجربته على راسم تردد مستمر.'
    }
  ]);

  // Loading / notification states
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

  // Form Inputs: Equipment (العتاد)
  const [eqName, setEqName] = useState('');
  const [eqLabId, setEqLabId] = useState('');
  const [eqValidity, setEqValidity] = useState<'OK' | 'Needs Maintenance' | 'Damaged'>('OK');
  const [eqBorrowable, setEqBorrowable] = useState(true);
  const [eqInterval, setEqInterval] = useState(6);
  const [eqImageUrl, setEqImageUrl] = useState('');

  // Form Inputs: Software (البرامج المثبتة)
  const [swName, setSwName] = useState('');
  const [swVersion, setSwVersion] = useState('');
  const [swLabId, setSwLabId] = useState('');

  // Form Inputs: RFID Assignment
  const [rfidCode, setRfidCode] = useState('');
  const [rfidProfId, setRfidProfId] = useState('');

  // Selected equipment for viewing ISO Calibration schedule
  const [selectedIsoEqId, setSelectedIsoEqId] = useState<string>('');

  // Editing state variables
  const [editingLab, setEditingLab] = useState<any | null>(null);
  const [editingProf, setEditingProf] = useState<any | null>(null);
  const [editingEquip, setEditingEquip] = useState<any | null>(null);
  const [editingSch, setEditingSch] = useState<any | null>(null);

  // Form states for edits
  const [editLabName, setEditLabName] = useState('');
  const [editLabDept, setEditLabDept] = useState('');

  const [editProfName, setEditProfName] = useState('');
  const [editProfDept, setEditProfDept] = useState('');
  const [editProfRfid, setEditProfRfid] = useState('');

  const [editEquipmentName, setEditEquipmentName] = useState('');
  const [editEquipLabId, setEditEquipLabId] = useState('');
  const [editEquipValidity, setEditEquipValidity] = useState<'OK' | 'Needs Maintenance' | 'Damaged'>('OK');
  const [editEquipBorrowable, setEditEquipBorrowable] = useState(true);
  const [editEquipInterval, setEditEquipInterval] = useState(6);
  const [editEquipImageUrl, setEditEquipImageUrl] = useState('');

  const [editSchSubject, setEditSchSubject] = useState('');
  const [editSchProfId, setEditSchProfId] = useState('');
  const [editSchLabId, setEditSchLabId] = useState('');
  const [editSchTime, setEditSchTime] = useState('');

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
      '/api/borrow-requests',
      '/api/complaints',
      '/api/rfid-cards',
      '/api/software',
      '/api/settings'
    ];

    Promise.all(endpoints.map((e) => fetch(e).then((r) => r.json())))
      .then(([labs, profs, schs, equips, borrows, compls, rfids, software, hwSettings]) => {
        setLaboratories(labs);
        setProfessors(profs);
        setSchedules(schs);
        setEquipmentList(equips);
        setBorrowRequests(borrows);
        setComplaints(compls);
        setRfidCards(rfids);
        setSoftwareList(software || []);
        if (hwSettings) {
          setRaspberryPiIp(hwSettings.raspberryPiIp || '192.168.1.100');
          setEsp32Ip(hwSettings.esp32Ip || '192.168.1.101');
        }
        checkSystemDomainInfo();

        // Auto-select first equipment for ISO viewing if none selected
        if (equips.length > 0 && !selectedIsoEqId) {
          const firstId = equips[0]._id || equips[0].id;
          setSelectedIsoEqId(firstId);
        }
      })
      .catch((err) => showNotification('خطأ أثناء مزامنة البيانات: ' + err.message, 'error'))
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
        showNotification(`تمت إضافة مخبر جديد: ${newLab.name}`, 'success');
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
      showNotification('يرجى ملء كافة تفاصيل الجدول الدراسي', 'error');
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
        showNotification('تمت جدولة الحصة الدراسية وإسقاطها بالجدول بنجاح!', 'success');
        setSchSubject('');
        setSchProfId('');
        setSchLabId('');
        setSchTime('');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 4. Submit Equipment
  const handleAddEquipment = (e: FormEvent) => {
    e.preventDefault();
    if (!eqName || !eqLabId) {
      showNotification('يرجى كتابة اسم العتاد وتحديد المخبر', 'error');
      return;
    }

    const labObj = laboratories.find((l) => (l._id || l.id) === eqLabId);
    if (!labObj) return;

    fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: eqName,
        laboratoryId: eqLabId,
        laboratoryName: labObj.name,
        validity: eqValidity,
        isBorrowable: eqBorrowable,
        calibrationInterval: eqInterval,
        imageUrl: eqImageUrl,
      }),
    })
      .then((res) => res.json())
      .then((newEq) => {
        setEquipmentList([...equipmentList, newEq]);
        showNotification(`تمت إضافة العتاد المذكور بنجاح وتوليد خطة معايرة لمدة 5 سنوات!`, 'success');
        setEqName('');
        setEqLabId('');
        setEqValidity('OK');
        setEqBorrowable(true);
        setEqInterval(12);
        setEqImageUrl('');
        // set selected view to this new item
        setSelectedIsoEqId(newEq._id || newEq.id);
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 4.5. Submit Software (البرامج المثبتة)
  const handleAddSoftware = (e: FormEvent) => {
    e.preventDefault();
    if (!swName || !swLabId) {
      showNotification('يرجى تزويد اسم البرنامج واختيار المخبر', 'error');
      return;
    }

    const labObj = laboratories.find((l) => (l._id || l.id) === swLabId);
    if (!labObj) return;

    fetch('/api/software', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: swName,
        version: swVersion,
        laboratoryId: swLabId,
        laboratoryName: labObj.name,
      }),
    })
      .then((res) => res.json())
      .then((newSoft) => {
        setSoftwareList([...softwareList, newSoft]);
        showNotification(`تمت إضافة وتسجيل البرنامج المثبت: ${newSoft.name} بنجاح!`, 'success');
        setSwName('');
        setSwVersion('');
        setSwLabId('');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  const handleDeleteSoftware = (id: string) => {
    fetch(`/api/software/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setSoftwareList(softwareList.filter((s) => (s._id || s.id) !== id));
        showNotification('تمت إزالة وتطهير البرنامج من سجل العتاد المكتبي للمخبر', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Delete Laboratory
  const handleDeleteLab = (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المخبر؟')) return;
    fetch(`/api/laboratories/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setLaboratories(laboratories.filter((l) => (l._id || l.id) !== id));
        showNotification('تم حذف المخبر بنجاح', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Edit Laboratory
  const handleEditLabSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingLab || !editLabName || !editLabDept) return;

    fetch(`/api/laboratories/${editingLab._id || editingLab.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editLabName, department: editLabDept }),
    })
      .then((res) => res.json())
      .then((updatedLab) => {
        setLaboratories(laboratories.map((l) => ((l._id || l.id) === (updatedLab._id || updatedLab.id) ? updatedLab : l)));
        showNotification('تم تحديث المخبر بنجاح', 'success');
        setEditingLab(null);
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Delete Professor
  const handleDeleteProf = (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الأستاذ؟')) return;
    fetch(`/api/professors/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setProfessors(professors.filter((p) => (p._id || p.id) !== id));
        showNotification('تم حذف الأستاذ بنجاح', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Edit Professor
  const handleEditProfSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingProf || !editProfName || !editProfDept) return;

    fetch(`/api/professors/${editingProf._id || editingProf.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editProfName, department: editProfDept, rfidCard: editProfRfid }),
    })
      .then((res) => res.json())
      .then((updatedProf) => {
        setProfessors(professors.map((p) => ((p._id || p.id) === (updatedProf._id || updatedProf.id) ? updatedProf : p)));
        showNotification('تم تحديث بيانات الأستاذ بنجاح', 'success');
        setEditingProf(null);
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Delete Schedule
  const handleDeleteSchedule = (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحصة الدراسية؟')) return;
    fetch(`/api/schedules/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setSchedules(schedules.filter((s) => (s._id || s.id) !== id));
        showNotification('تم حذف الحصة بنجاح', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Edit Schedule
  const handleEditScheduleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingSch || !editSchSubject || !editSchProfId || !editSchLabId || !editSchTime) return;

    const profObj = professors.find((p) => (p._id || p.id) === editSchProfId);
    const labObj = laboratories.find((l) => (l._id || l.id) === editSchLabId);
    if (!profObj || !labObj) return;

    fetch(`/api/schedules/${editingSch._id || editingSch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: editSchSubject,
        professorId: editSchProfId,
        professorName: profObj.name,
        laboratoryId: editSchLabId,
        laboratoryName: labObj.name,
        timeSlot: editSchTime
      }),
    })
      .then((res) => res.json())
      .then((updatedSch) => {
        setSchedules(schedules.map((s) => ((s._id || s.id) === (updatedSch._id || updatedSch.id) ? updatedSch : s)));
        showNotification('تم تحديث الحصة الدراسية بنجاح', 'success');
        setEditingSch(null);
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Delete Equipment
  const handleDeleteEquipment = (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العتاد؟')) return;
    fetch(`/api/equipment/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setEquipmentList(equipmentList.filter((e) => (e._id || e.id) !== id));
        showNotification('تم حذف العتاد بنجاح', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Edit Equipment
  const handleEditEquipmentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingEquip || !editEquipmentName || !editEquipLabId) return;

    const labObj = laboratories.find((l) => (l._id || l.id) === editEquipLabId);
    if (!labObj) return;

    fetch(`/api/equipment/${editingEquip._id || editingEquip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editEquipmentName,
        laboratoryId: editEquipLabId,
        laboratoryName: labObj.name,
        validity: editEquipValidity,
        isBorrowable: editEquipBorrowable,
        calibrationInterval: editEquipInterval,
        imageUrl: editEquipImageUrl
      }),
    })
      .then((res) => res.json())
      .then((updatedEq) => {
        setEquipmentList(equipmentList.map((e) => ((e._id || e.id) === (updatedEq._id || updatedEq.id) ? updatedEq : e)));
        showNotification('تم تحديث العتاد بنجاح', 'success');
        setEditingEquip(null);
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 5. Submit RFID card
  const handleAssignRfid = (e: FormEvent) => {
    e.preventDefault();
    if (!rfidCode || !rfidProfId) {
      showNotification('يرجى تزويد كود RFID واختيار الأستاذ', 'error');
      return;
    }

    const prof = professors.find((p) => (p._id || p.id) === rfidProfId);
    if (!prof) return;

    fetch('/api/rfid-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfidCode,
        professorId: rfidProfId,
        professorName: prof.name,
      }),
    })
      .then((res) => res.json())
      .then((newCard) => {
        setRfidCards([...rfidCards, newCard]);
        // update local professors state to reflect RFID
        setProfessors(
          professors.map((p) => {
            if ((p._id || p.id) === rfidProfId) {
              return { ...p, rfidCard: rfidCode };
            }
            return p;
          })
        );
        showNotification(`تم تسجيل وبث بطاقة RFID بنجاح للأستاذ ${prof.name}`, 'success');
        setRfidCode('');
        setRfidProfId('');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 5.5. Save Hardware Settings
  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raspberryPiIp,
        esp32Ip,
      }),
    })
      .then((res) => res.json())
      .then((saved) => {
        setRaspberryPiIp(saved.raspberryPiIp);
        setEsp32Ip(saved.esp32Ip);
        showNotification('تمت مزامنة وتأمين إعدادات العناوين للشبكة واللوحات الإلكترونية بنجاح! 💾', 'success');
      })
      .catch((err) => showNotification('فشل الحفظ: ' + err.message, 'error'))
      .finally(() => setSettingsLoading(false));
  };

  // Simulate Card swipe triggers door lock
  const handleSimulateCardUnlock = (e: FormEvent) => {
    e.preventDefault();
    if (!simCardCode) {
      showNotification('يرجى اختيار أو تصريح برقم بطاقة RFID لمحاكاتها', 'error');
      return;
    }

    setSimLog([]);
    setLockStatus('unlocking');

    const addLogStep = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setSimLog((prev) => [...prev, `[${new Date().toLocaleTimeString('ar-DZ')}] ${msg}`]);
          resolve();
        }, delay);
      });
    };

    // Step-by-step interactive logs rendering
    addLogStep(`📡 محاولة الاتصال بـمحطة الرازبيري باي للقسم: ${raspberryPiIp || '192.168.1.100'}...`, 0)
      .then(() => addLogStep(`🏷️ تم التقاط إشارة موجة كهرومغناطيسية RFID قريبة...`, 1000))
      .then(() => addLogStep(`🔎 قراءة كود البطاقة الذكية: [${simCardCode}] وبثها لوحدة خادم الويب للتحقق من الصلاحيات...`, 800))
      .then(() => {
        const prof = professors.find((p) => {
          if (!p.rfidCard) return false;
          const trimmedCard = p.rfidCard.trim().toLowerCase();
          const trimmedInput = simCardCode.trim().toLowerCase();
          return (
            trimmedCard === trimmedInput ||
            trimmedCard === `rfid-${trimmedInput}` ||
            `rfid-${trimmedCard}` === trimmedInput
          );
        });

        if (prof) {
          return addLogStep(`✅ تم التحقق: بطاقة الأستاذ «${prof.name}» صالحة ومصرح برقمها بالكامل!`, 1000)
            .then(() => addLogStep(`🔌 إرسال إشارة التحكم والتحميل إلى لوحة ESP32 Relay (IP: http://${esp32Ip || '192.168.1.101'}/unlock)...`, 1100))
            .then(() => {
              setLockStatus('unlocked');
              const labNameVal = simSelectedLab ? (laboratories.find(l => (l._id || l.id) === simSelectedLab)?.name || 'المخبر') : 'المخبر المستضيف';
              return addLogStep(`🔓 نجاح الفتح: القفل الكهرومغناطيسي لـ [${labNameVal}] مفتوح الآن... (الريلي مغلق حالياً 🟢)`, 900);
            })
            .then(() => {
              setTimeout(() => {
                setLockStatus('locked');
                setSimLog((prev) => [...prev, `[${new Date().toLocaleTimeString('ar-DZ')}] 🔒 تم إعادة إغلاق قفل الباب تلقائياً وتأمين المخبر الجديد.`]);
              }, 5000);
            });
        } else {
          setLockStatus('locked');
          return addLogStep(`❌ رفض الدخول: البطاقة [${simCardCode}] غير مسجلة لأي أستاذ بالقسم، تم حظر قفل ESP32 وإطلاق وميض أحمر إنذاري 🚨`, 1500);
        }
      });
  };

  // 6. Handle Borrow Approval / Reject
  const handleBorrowStatus = (requestId: string, status: 'Approved' | 'Rejected') => {
    fetch(`/api/borrow-requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('فشلت معالجة الطلب');
        return res.json();
      })
      .then((updated) => {
        setBorrowRequests(
          borrowRequests.map((r) => ((r._id || r.id) === requestId ? updated : r))
        );
        showNotification(status === 'Approved' ? 'تم الموافقة على الاستعارة وتأكيد الحجز' : 'تم رفض طلب الاستعارة', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // 7. Handle Complaint Mark Active / Resolved
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
        showNotification('تم وسم الشكوى بأنها سويت وتم الرد عليها بنجاح.', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Update specific calibration point state
  const toggleCalibrationPoint = (eqId: string, pointIndex: number) => {
    const equip = equipmentList.find((e) => (e._id || e.id) === eqId);
    if (!equip) return;

    const updatedSched = [...equip.calibrationSchedule];
    const item = { ...updatedSched[pointIndex] };
    item.status = item.status === 'Completed' ? 'Pending' : 'Completed';
    updatedSched[pointIndex] = item;

    fetch(`/api/equipment/${eqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calibrationSchedule: updatedSched }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setEquipmentList(equipmentList.map((e) => ((e._id || e.id) === eqId ? updated : e)));
        showNotification('تم تحديث حالة دورة المعايرة المذكورة للعتاد (ISO)', 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Submit Curative Maintenance report and fix equipment health
  const handleSubmitCurativeMaintenance = (e: FormEvent) => {
    e.preventDefault();
    if (!mntEqId || !mntEngineer || !mntAction || !mntDate) {
      showNotification('يرجى تعبئة الحقول الأساسية لتقرير الصيانة العلاجية', 'error');
      return;
    }

    const eqObj = equipmentList.find(item => (item._id || item.id) === mntEqId);
    if (!eqObj) return;

    fetch(`/api/equipment/${mntEqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validity: 'OK' }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('فشلت عملية حفظ التعديلات في أجهزة المخبر');
        return res.json();
      })
      .then((updatedEq) => {
        // Update equipment array
        setEquipmentList(equipmentList.map(e => ((e._id || e.id) === mntEqId ? updatedEq : e)));

        // Create log record
        const newLog = {
          id: 'mnt-' + Date.now(),
          equipmentName: eqObj.name,
          laboratoryName: eqObj.laboratoryName,
          engineer: mntEngineer,
          action: mntAction,
          date: mntDate,
          notes: mntNotes
        };
        setCurativeLogs([newLog, ...curativeLogs]);
        showNotification(`بشرى سارة: تم إصلاح وتأهيل جهاز ${eqObj.name} وتحويل حالته إلى سليم وجاهز للاستعمال ✅`, 'success');

        // Reset form inputs
        setMntEqId('');
        setMntEngineer('');
        setMntAction('');
        setMntDate('');
        setMntNotes('');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Update general equipment validity
  const handleUpdateValidity = (eqId: string, newValidity: 'OK' | 'Needs Maintenance' | 'Damaged') => {
    fetch(`/api/equipment/${eqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validity: newValidity }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setEquipmentList(equipmentList.map((e) => ((e._id || e.id) === eqId ? updated : e)));
        showNotification(`تم تغيير سلامة وصلاحية العتاد إلى: ${newValidity}`, 'success');
      })
      .catch((err) => showNotification(err.message, 'error'));
  };

  // Filters
  // Secretary General complains are for 'Secretary General'. Lab supervisors are for 'Lab Supervisor'
  const filteredComplaints = complaints.filter(
    (c) => c.targetRole === (isSecGen ? 'Secretary General' : 'Lab Supervisor')
  );

  const selectedIsoEquipment = equipmentList.find((e) => (e._id || e.id) === selectedIsoEqId);

  return (
    <div
      className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800"
      dir="rtl"
    >
      {/* Header */}
      <header
        className={`text-white shadow-md transition-all ${
          isSecGen
            ? 'bg-gradient-to-l from-slate-700 to-slate-900 border-b border-slate-600'
            : 'bg-gradient-to-l from-blue-700 to-cyan-800'
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
                {isSecGen ? 'ديوان الأمانة العامة للكلية (Secretary General Bureau)' : 'نظام إدارة المخابر والعتاد العلمي'}
              </h1>
              <p className="text-xs text-blue-100 mt-1">
                {isSecGen
                  ? 'رؤية صلاحيات مسؤول المخابر والتنظيم الهيكلي والدعم اللوجستي العام'
                  : 'أدوار مسؤول المخابر: تهيئة ورصد المخابر، جدول المعايرة والتحسين المستمر'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <button
              onClick={fetchAllData}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
              title="مزامنة وتحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="bg-white/10 px-4 py-2 rounded-full border border-white/20 text-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
              {isSecGen ? 'رتبة: الأمين العام للكلية' : 'رتبة: مسؤول المخابر والتجهيز'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Banner notification */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 border shadow-sm transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Tab row navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-px">
          <button
            onClick={() => setActiveTab('labs_profs')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === 'labs_profs'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            المخابر والأساتذة & RFID
          </button>
          <button
            onClick={() => setActiveTab('equip')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === 'equip'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            إضافة وإدارة العتاد
          </button>
          <button
            onClick={() => setActiveTab('iso_quality')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'iso_quality'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            الجودة الأكاديمية (ISO) والمعايرة
          </button>
          <button
            onClick={() => setActiveTab('borrow')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all relative ${
              activeTab === 'borrow'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            طلبات الاستعارة الأسبوعية
            {borrowRequests.filter((r) => r.status === 'Pending').length > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold">
                {borrowRequests.filter((r) => r.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all relative ${
              activeTab === 'complaints'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            مركز الشكاوى والبلاغات
            {filteredComplaints.filter((c) => c.status === 'Pending').length > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold">
                {filteredComplaints.filter((c) => c.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            إعدادات الأجهزة والشبكة (IP)
          </button>
        </div>

        {/* Dynamic Panels */}

        {/* 1. Laboratories, Professors & RFID cards setup */}
        {activeTab === 'labs_profs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Adding Panels */}
            <div className="lg:col-span-1 space-y-6">
              {/* Add Laboratory */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  إضافة مخبر علمي جديد
                </h3>
                <form onSubmit={handleAddLab} className="space-y-3">
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="مثل: مخبر الشبكات والبحث العلمي"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={labDept}
                    onChange={(e) => setLabDept(e.target.value)}
                    placeholder="القسم (مثال: علوم الحاسوب)"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-orange-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    تأكيد إضافة المخبر
                  </button>
                </form>
              </div>

              {/* Add Professor */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  تسجيل أستاذ جديد بالقسم
                </h3>
                <form onSubmit={handleAddProf} className="space-y-3">
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    placeholder="اسم الأستاذ الكامل"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={profDept}
                    onChange={(e) => setProfDept(e.target.value)}
                    placeholder="القسم التابع له الأستاذ"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    تسجيل الأستاذ
                  </button>
                </form>
              </div>

              {/* Assign RFID card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-cyan-600" />
                  بطاقات RFID لدخول المخابر للأساتذة
                </h3>
                <form onSubmit={handleAssignRfid} className="space-y-3">
                  <select
                    value={rfidProfId}
                    onChange={(e) => setRfidProfId(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- اختر الأستاذ المعني --</option>
                    {professors.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={rfidCode}
                    onChange={(e) => setRfidCode(e.target.value)}
                    placeholder="رقم بطاقة RFID أو الكود التناظري"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono text-left"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                  >
                    ربط وتخصيص البطاقة
                  </button>
                </form>
              </div>
            </div>

            {/* List and Scheduling Grid */}
            <div className="lg:col-span-2 space-y-6">
              {/* Display list of labs and professors */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm text-slate-700 mb-3">هيكل المخابر والأساتذة المعرفين</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-600 mb-2">المخابر العلمية المسجلة ({laboratories.length})</h4>
                    <ul className="text-xs space-y-2 max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {laboratories.map((l) => (
                        <li key={l._id || l.id} className="pt-2 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-700 block">{l.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({l.department})</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLab(l);
                                setEditLabName(l.name);
                                setEditLabDept(l.department);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLab(l._id || l.id || '')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold"
                            >
                              حذف
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-600 mb-2">قائمة الكادر الأكاديمي ({professors.length})</h4>
                    <ul className="text-xs space-y-2 max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {professors.map((p) => (
                        <li key={p._id || p.id} className="pt-2 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-700 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.rfidCard ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-mono">
                                RFID: {p.rfidCard}
                              </span>
                            ) : (
                              <span className="bg-slate-200 text-slate-500 text-[9px] px-2 py-0.5 rounded-full">
                                بدون بطاقة
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProf(p);
                                setEditProfName(p.name);
                                setEditProfDept(p.department);
                                setEditProfRfid(p.rfidCard || '');
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProf(p._id || p.id || '')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold"
                            >
                              حذف
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Dynamic block for adding schedules */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  برمجة حصص دراسية وتوقيت في جدول المخابر
                </h3>
                <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">اسم الحصة والمادة</label>
                    <input
                      type="text"
                      value={schSubject}
                      onChange={(e) => setSchSubject(e.target.value)}
                      placeholder="مثال: هندسة الإلكترونيات"
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">التوقيت والتاريخ</label>
                    <input
                      type="text"
                      value={schTime}
                      onChange={(e) => setSchTime(e.target.value)}
                      placeholder="الأحد 08:30 - 10:00"
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">الأستاذ المكلّف بالتدريس</label>
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
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">المخبر المستضيف للدرس</label>
                    <select
                      value={schLabId}
                      onChange={(e) => setSchLabId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">-- اختر مخبراً --</option>
                      {laboratories.map((l) => (
                        <option key={l._id || l.id} value={l._id || l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                    >
                      إدراج في جدول تدريس المخابر
                    </button>
                  </div>
                </form>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-600 mb-3">الحصص المجدولة الحالية ({schedules.length})</h4>
                  {schedules.length === 0 ? (
                    <p className="text-xs text-slate-400">لا توجد حصص مجدولة حالياً.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {schedules.map((sch) => (
                        <div key={sch._id || sch.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2">
                          <div>
                            <span className="font-bold text-slate-800 text-sm block text-indigo-955">{sch.subject}</span>
                            <div className="flex flex-wrap gap-x-3 text-slate-500 text-[11px] mt-1">
                              <span>الأستاذ: <strong className="text-slate-600">{sch.professorName}</strong></span>
                              <span>المخبر: <strong className="text-slate-600">{sch.laboratoryName}</strong></span>
                              <span>التوقيت: <strong className="text-slate-700 font-mono">{sch.timeSlot}</strong></span>
                            </div>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSch(sch);
                                setEditSchSubject(sch.subject);
                                setEditSchProfId(sch.professorId);
                                setEditSchLabId(sch.laboratoryId);
                                setEditSchTime(sch.timeSlot);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(sch._id || sch.id || '')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Adding / Modifying Equipment */}
        {activeTab === 'equip' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Adding equipment form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                <Wrench className="w-4.5 h-4.5 text-blue-600" />
                إضافة عتاد ذكي جديد للمخبر
              </h3>
              <form onSubmit={handleAddEquipment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم القطعة أو العتاد *</label>
                  <input
                    type="text"
                    value={eqName}
                    onChange={(e) => setEqName(e.target.value)}
                    required
                    placeholder="مثال: ذراع ميكانيكية روبوتية 6-Axis"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تنسيب العتاد لمخبر معين *</label>
                  <select
                    value={eqLabId}
                    onChange={(e) => setEqLabId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- اختر مخبراً حاضناً --</option>
                    {laboratories.map((l) => (
                      <option key={l._id || l.id} value={l._id || l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الحالة الإنشائية للقطعة المعينة *</label>
                  <select
                    value={eqValidity}
                    onChange={(e) => setEqValidity(e.target.value as any)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="OK">سليم وجاهز للاستفادة منها (OK)</option>
                    <option value="Needs Maintenance">بحاجة لصيانة دورية ومعايرة</option>
                    <option value="Damaged">معطل وتالف تماماً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">دورة المعايرة المستمرة بالإطالوناج *</label>
                  <select
                    value={eqInterval}
                    onChange={(e) => setEqInterval(parseInt(e.target.value, 10))}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  >
                    <option value="3">كل 3 أشهر (معايرة ربع سنوية)</option>
                    <option value="6">كل 6 أشهر (معايرة نصف سنوية)</option>
                    <option value="12">كل 12 شهراً (معايرة سنوية)</option>
                    <option value="24">كل 24 شهراً (كل سنتين)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isBorrowableEq"
                    checked={eqBorrowable}
                    onChange={(e) => setEqBorrowable(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="isBorrowableEq" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    يسمح للطلاب بتقديم طلب استعارة لهذه القطعة
                  </label>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">صورة أو عتاد توضيحي للقطعة</label>
                  
                  {/* Image Preview Box */}
                  <div className="w-full h-32 bg-slate-50 border border-dashed border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative">
                    {eqImageUrl ? (
                      <>
                        <img src={eqImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEqImageUrl('')}
                          className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-750 text-white p-1 rounded-full text-[10px] transition-colors font-bold"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-3 text-slate-400 text-[11px]">
                        <span className="block mb-1">📷 لا يوجد صورة محددة للعتاد</span>
                        <span>استخدم الخيارات أدناه لإرفاق واحدة</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-center py-2 px-1 rounded-lg text-[10.5px] font-bold block">
                      📎 ارفاق ملف صورة
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setEqImageUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt('أدخل رابط الصورة المباشر من الإنترنت:');
                        if (url) setEqImageUrl(url);
                      }}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 px-1 rounded-lg text-[10.5px] font-bold"
                    >
                      🌐 أدخل رابط URL
                    </button>
                  </div>

                  {/* Gallery Presets */}
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">أو اختر صورة جاهزة بسرعة:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: '🔬 مجهر', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=80' },
                        { label: '📡 راسم إشارات', url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9aae9d?auto=format&fit=crop&w=300&q=80' },
                        { label: '💡 لوحة أردوينو', url: 'https://images.unsplash.com/photo-1553406830-ef2513410d7c?auto=format&fit=crop&w=300&q=80' },
                        { label: '💻 حاسوب مخبري', url: 'https://images.unsplash.com/photo-1517055720413-77a0bf2589d3?auto=format&fit=crop&w=300&q=80' },
                        { label: '🔌 ملتيمتر رقمي', url: 'https://images.unsplash.com/photo-1601524909162-be87252be298?auto=format&fit=crop&w=300&q=80' },
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset.label}
                          onClick={() => setEqImageUrl(preset.url)}
                          className="text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  إضافة العتاد وتخصيص خطة ISO التلقائية
                </button>
              </form>
            </div>

            {/* Equipment status and change logic */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-2">العتاد والأجهزة الموجودة بالمخابر</h3>
              <p className="text-xs text-slate-400 mb-4">قائمة لحصر العتاد وتعديل حالة صلاحيتها في أي وقت.</p>

              {equipmentList.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد عتاد مضاف حالياً.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3">اسم العتاد</th>
                        <th className="p-3">المخبر</th>
                        <th className="p-3">صلاحية العتاد الحالية</th>
                        <th className="p-3">قابلية الاستعارة</th>
                        <th className="p-3">دورة المعايرة</th>
                        <th className="p-3 text-center">أوامر سريعة</th>
                        <th className="p-3 text-center">التحكم بالعتاد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {equipmentList.map((eq) => (
                        <tr key={eq._id || eq.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              {eq.imageUrl ? (
                                <img src={eq.imageUrl} alt={eq.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-white" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[15px] border border-slate-200">📦</div>
                              )}
                              <span className="truncate max-w-[150px]">{eq.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-500">{eq.laboratoryName}</td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                eq.validity === 'OK'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : eq.validity === 'Needs Maintenance'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {eq.validity === 'OK'
                                ? 'سليم وجاهز'
                                : eq.validity === 'Needs Maintenance'
                                ? 'صيانة لازمة'
                                : 'معطل تالف'}
                            </span>
                          </td>
                          <td className="p-3">
                            {eq.isBorrowable ? (
                              <span className="text-emerald-600 font-semibold text-[11px]">مسموح بالاستعارة</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">للاستعمال الداخلي فقط</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500 font-mono">كل {eq.calibrationInterval} أشهر</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleUpdateValidity(eq._id || eq.id || '', 'OK')}
                                className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
                                title="وسم كسليم"
                              >
                                سليم
                              </button>
                              <button
                                onClick={() => handleUpdateValidity(eq._id || eq.id || '', 'Needs Maintenance')}
                                className="px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-bold"
                                title="تبليغ صيانة"
                              >
                                صيانة
                              </button>
                              <button
                                onClick={() => handleUpdateValidity(eq._id || eq.id || '', 'Damaged')}
                                className="px-1.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold"
                                title="تالف"
                              >
                                تالف
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <EquipmentQRButton equipment={eq} />
                              <button
                                onClick={() => {
                                  setEditingEquip(eq);
                                  setEditEquipmentName(eq.name);
                                  setEditEquipLabId(eq.laboratoryId);
                                  setEditEquipValidity(eq.validity as any);
                                  setEditEquipBorrowable(eq.isBorrowable);
                                  setEditEquipInterval(eq.calibrationInterval);
                                  setEditEquipImageUrl(eq.imageUrl || '');
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold"
                                title="تعديل تفاصيل العتاد"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteEquipment(eq._id || eq.id || '')}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold"
                                title="حذف العتاد بالكامل"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* -- START SOFTWARE INVENTORY SECTION (خانة خاصة بالبرامج) -- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pt-8 border-t border-slate-200 col-span-1 lg:col-span-3">
              {/* Adding Software form panel */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit text-right">
                <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-1.5 text-indigo-700">
                  <Layers className="w-4.5 h-4.5 text-indigo-600" />
                  إضافة وتحميل برمجية ذكية للمخبر
                </h3>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  قم بتسجيل وتوثيق البرامج وحزم المحاكاة أو بيئات التطوير التي تم تثبيتها في أجهزة المخبر المعني لقابلية الاطلاع.
                </p>
                <form onSubmit={handleAddSoftware} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم البرنامج المكتبي أو الحزمة *</label>
                    <input
                      type="text"
                      value={swName}
                      onChange={(e) => setSwName(e.target.value)}
                      required
                      placeholder="مثل: MATLAB R2023a, VS Code, Packet Tracer..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الإصدار / النسخة (Version)</label>
                    <input
                      type="text"
                      value={swVersion}
                      onChange={(e) => setSwVersion(e.target.value)}
                      placeholder="مثل: v2023a, v3.11, v8.2..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">تنسيب وتثبيت البرنامج في مخبر مخصص *</label>
                    <select
                      value={swLabId}
                      onChange={(e) => setSwLabId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">-- اختر المخبر المستضيف --</option>
                      {laboratories.map((l) => (
                        <option key={l._id || l.id} value={l._id || l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    تأكيد وتسجيل تثبيت البرمجية
                  </button>
                </form>
              </div>

              {/* Software display list */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-right">
                <h3 className="text-sm font-black text-slate-880 mb-1.5 flex items-center gap-1">
                  البرمجيات والتراخيص المثبتة لكل مخبر
                </h3>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-normal">
                  سجل للبرمجيات، حزم المحاكاة والمحاكيات النشطة بمحطات عمل ومحاكيات المخابر لتسهيل جرد المحتوى اللوجستي المتكامل للطلاب والأساتذة.
                </p>

                {softwareList.length === 0 ? (
                   <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                     لا توجد برمجيات علمية مسجلة في المخابر حالياً.
                   </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                          <th className="p-3">اسم البرنامج</th>
                          <th className="p-3">الإصدار</th>
                          <th className="p-3">المخبر المستضيف</th>
                          <th className="p-3 text-center">تاريخ التثبيت</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {softwareList.map((soft) => (
                          <tr key={soft._id || soft.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{soft.name}</td>
                            <td className="p-3 text-slate-600 font-mono">{soft.version || 'غير محدد'}</td>
                            <td className="p-3 text-slate-500 font-medium">{soft.laboratoryName}</td>
                            <td className="p-3 text-center text-slate-400 font-mono">{soft.installDate || '2026-06-11'}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteSoftware(soft._id || soft.id || '')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold transition-colors"
                              >
                                إزالة
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. ISO Quality & Calibration Tables */}
        {activeTab === 'iso_quality' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-right">
            <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-850 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  خلية تنظيم وضمان الجودة الأكاديمية والمخبرية
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  مراقبة الأجهزة وتطبيق اللوائح الفنية عبر المعايرة الدورية الوقائية وجداول الصيانة العلاجية والاستدراكية.
                </p>
              </div>

              {/* Sub tabs to separate calibration and maintenance */}
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit self-end md:self-auto border">
                <button
                  type="button"
                  onClick={() => setQualitySubTab('preventive')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    qualitySubTab === 'preventive'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  معايرة وقائية (Preventive)
                </button>
                <button
                  type="button"
                  onClick={() => setQualitySubTab('curative')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    qualitySubTab === 'curative'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  صيانة علاجية (Curative)
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Preventive Calibration (معايرة وقائية) */}
            {qualitySubTab === 'preventive' && (
              <div>
                <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl mb-6">
                  <h4 className="text-xs font-extrabold text-blue-900 mb-1">💡 بروتوكول المعايرة الوقائية التلقائية المتواصلة</h4>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    يسرد هذا المخطط نقاط الفحص الوقائي (الإطالوناج) المجدولة تلقائياً على مدار 5 سنوات عند إضافة كل جهاز جديد للقسم بناءً على دورة الصلاحية المستهدفة لضمان سلامة قراءة التجهيزات.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Selector Sidebar */}
                  <div className="lg:col-span-1 border-l border-slate-100 pl-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 mb-3">اختر العتاد لمعاينة خطة المعايرة:</h4>
                    {equipmentList.map((eq) => (
                      <button
                        key={eq._id || eq.id}
                        type="button"
                        onClick={() => setSelectedIsoEqId(eq._id || eq.id || '')}
                        className={`w-full text-right p-3 rounded-xl transition-all border text-xs flex flex-col gap-1 ${
                          selectedIsoEqId === (eq._id || eq.id)
                            ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                            : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-semibold">{eq.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{eq.laboratoryName}</span>
                      </button>
                    ))}
                  </div>

                  {/* Right Schedule View */}
                  <div className="lg:col-span-3">
                    {selectedIsoEquipment ? (
                      <div>
                        <div className="flex items-center justify-between mb-4 bg-slate-50 p-4 rounded-xl border border-slate-205">
                          <div>
                            <h3 className="font-bold text-sm text-slate-800">{selectedIsoEquipment.name}</h3>
                            <p className="text-[11px] text-slate-500">{selectedIsoEquipment.laboratoryName}</p>
                          </div>
                          <div className="text-left text-xs text-slate-500 font-mono">
                            <span>دورة المعايرة: كل </span>
                            <strong className="text-slate-800 font-bold">{selectedIsoEquipment.calibrationInterval}</strong>
                            <span> أشهر تلقائياً</span>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-100 rounded-xl">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                                <th className="p-3">دورة الفحص المستهدفة</th>
                                <th className="p-3">قيمة المعايرة / المخرجات المرجعية</th>
                                <th className="p-3 text-center">حالة الفحص الوقائي</th>
                                <th className="p-3 text-center">أمر تصديق مسؤول المخبر</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedIsoEquipment.calibrationSchedule &&
                                selectedIsoEquipment.calibrationSchedule.map((point, index) => (
                                  <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-700 font-mono">{point.date}</td>
                                    <td className="p-3 text-slate-600">{point.targetValue}</td>
                                    <td className="p-3 text-center">
                                      {point.status === 'Completed' ? (
                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                          <Check className="w-3 h-3" /> تمت بنجاح ✅
                                        </span>
                                      ) : (
                                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                          مجدولة / قيد الانتظار
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleCalibrationPoint(selectedIsoEquipment._id || selectedIsoEquipment.id || '', index)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                                          point.status === 'Completed'
                                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                      >
                                        {point.status === 'Completed' ? 'إلغاء التصديق' : 'مصادقة المعايرة'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-205">
                        الرجاء اختيار أو تسجيل جهاز من القائمة الجانبية لعرض نقاط المعايرة الوقائية التلقائية.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Curative Maintenance (صيانة علاجية) */}
            {qualitySubTab === 'curative' && (
              <div>
                <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-xl mb-6">
                  <h4 className="text-xs font-extrabold text-rose-900 mb-1">⚙️ بروتوكول الصيانة العلاجية والاستدراكية (إصلاح الأعطال الميدانية)</h4>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    يستخدم هذا القسم لتسجيل عمليات الإصلاح والتدخلات التقنية الفورية على التجهيزات التالفة أو التي تم التبليغ عنها كغير سليمة بالقسم. تعبئة هذا النموذج وإرساله سيعيد حالة الجهاز تلقائياً إلى "جاهز وسليم للعمل" مع تأصيل المحاضر في السجلات أدناه.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Form: Add Maintenance Report */}
                  <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 mb-4 text-indigo-700 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-rose-600" />
                      تدشين ملف تدخل وصيانة علاجية
                    </h3>
                    <form onSubmit={handleSubmitCurativeMaintenance} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">اختر التجهيز المراد إصلاحه *</label>
                        <select
                          value={mntEqId}
                          onChange={(e) => setMntEqId(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">-- حدد جهازاً من القائمة --</option>
                          {equipmentList.map((eq) => {
                            const isDamaged = eq.validity !== 'OK';
                            return (
                              <option key={eq._id || eq.id} value={eq._id || eq.id}>
                                {eq.name} ({eq.laboratoryName}) {isDamaged ? '⚠️ [بحاجة لمعالجة علاجية]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفني أو مهندس الصيانة المسؤول *</label>
                        <input
                          type="text"
                          value={mntEngineer}
                          onChange={(e) => setMntEngineer(e.target.value)}
                          required
                          placeholder="مثال: م. بوضياف الهادي"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التدخل العلاجي والاصلاح *</label>
                        <input
                          type="date"
                          value={mntDate}
                          onChange={(e) => setMntDate(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">تفصيل الإجراءات المتخذة ومواضع التصليح *</label>
                        <textarea
                          value={mntAction}
                          onChange={(e) => setMntAction(e.target.value)}
                          required
                          placeholder="مثال: تغيير الكيبل المهترئ، معالجة الدوائر الداخلية المتماسة، تثبيت ترانزستور مكبر إشارة جديد."
                          rows={3}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وشهادات ضبط الجودة (اختياري)</label>
                        <input
                          type="text"
                          value={mntNotes}
                          onChange={(e) => setMntNotes(e.target.value)}
                          placeholder="الجهد الكهربائي مستقر، عاد للعمل والتقاط إشارات راسم النبض الجانبي"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg transition-colors shadow-xs"
                      >
                        تسجيل المحضر وإعادة الجهاز كـ «سليم» ✅
                      </button>
                    </form>
                  </div>

                  {/* Right List: Past Curative Maintenance reports log */}
                  <div className="lg:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 mb-3">محاضر وسجل الأجهزة المصلَحة والجاهزة</h3>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-normal">
                      دفتر تسجيل التدخلات العلاجية التقنية لإثبات فحص الأجهزة بعد الأعطال وصلاحية إعادة وضعها تحت خدمة الطلبة والأساتذة للقسم.
                    </p>

                    {curativeLogs.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">لا يوجد أي تقرير صيانة علاجية مسجل حالياً.</div>
                    ) : (
                      <div className="space-y-4">
                        {curativeLogs.map((log) => (
                          <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-3xs flex flex-col gap-2">
                            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border">
                              <div>
                                <strong className="text-slate-800 text-xs block">{log.equipmentName}</strong>
                                <span className="text-[10px] text-slate-500">{log.laboratoryName}</span>
                              </div>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap">
                                تم الإصلاح والتشغيل ✅
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 py-1">
                              <div>👤 المهندس: <span className="font-semibold text-slate-700">{log.engineer}</span></div>
                              <div className="text-left">📆 تاريخ الإصلاح: <span className="font-mono text-slate-700">{log.date}</span></div>
                            </div>
                            <p className="p-2.5 bg-rose-50/50 text-rose-950 rounded border border-rose-100 italic leading-relaxed text-[11px]">
                              <strong>العمل المنجز:</strong> {log.action}
                            </p>
                            {log.notes && (
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                📝 ملاحظات الجودة: {log.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Student Borrow Requests Approval workflow */}
        {activeTab === 'borrow' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-2">طلبات الاستعارة للعتاد والمعدات</h3>
            <p className="text-xs text-slate-400 mb-6">مراجعة والبت في طلبات استعارة الأجهزة الذكية والملحقات من قبل طلاب الكلية.</p>

            {borrowRequests.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed text-slate-400">
                لا توجد طلبات استعارة مسجلة بالقسم.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="p-4">اسم الطالب المستعير</th>
                      <th className="p-4">العتاد والأجهزة المطلوبة</th>
                      <th className="p-4">مخبر التوزيع</th>
                      <th className="p-4 font-mono">تاريخ التقديم</th>
                      <th className="p-4 text-center">حالة الطلب</th>
                      <th className="p-4 text-center">إجراءات المخابر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {borrowRequests.map((req) => (
                      <tr key={req._id || req.id} className="hover:bg-slate-50 bg-white">
                        <td className="p-4 font-bold text-slate-700">{req.studentName}</td>
                        <td className="p-4 font-semibold text-slate-600">{req.equipmentName}</td>
                        <td className="p-4 text-slate-500">{req.laboratoryName}</td>
                        <td className="p-4 text-slate-500 font-mono">{req.requestedDate}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold ${
                              req.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : req.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {req.status === 'Pending' ? 'انتظار الموافقة' : req.status === 'Approved' ? 'مأذون ومقبول' : 'طلب مرفوض'}
                          </span>
                        </td>
                        <td className="p-4">
                          {req.status === 'Pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleBorrowStatus(req._id || req.id || '', 'Approved')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> قبول وإعارة
                              </button>
                              <button
                                onClick={() => handleBorrowStatus(req._id || req.id || '', 'Rejected')}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> رفض الطلب
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block text-center">تمت معالجة الطلب</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. Complaints section */}
        {activeTab === 'complaints' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-2">
              سجل الشكاوى الموجهة إلى {isSecGen ? 'ديوان الأمانة العامة للكلية' : 'مسؤولي المخابر'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">عرض وبحث في البلاغات والشكاوى المسجلة من طرف الطلاب حول أجهزة ومعدات ومرافق الكلية.</p>

            {filteredComplaints.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 text-slate-400 rounded-xl border border-dashed">
                لا توجد شكاوى أو بلاغات موجهة إليكم حالياً.
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
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                        >
                          وسم وتأكيد حل المشكلة
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> تمت التسوية وإغلاق الشكوى
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Network and Hardware Settings Section */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right font-sans">
            {/* Column 1: Configuration Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    إعدادات الربط والتحكم الشبكي (IoT Hardware Integration)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    تصريح بمنافذ وعناوين بروتوكول الإنترنت (IP addresses) الخاصة بـلوحة الرازبيري باي (قارئ البطاقات) واللوحة المجهرية ESP32 (ريلي قفل الباب).
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                    <span className="text-[11px] font-bold text-blue-800 block">🔌 إعدادات قارئ الـ RFID (Raspberry Pi)</span>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        عنوان IP لقارئ الرازبيري باي (Raspberry Pi IP Address):
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={raspberryPiIp}
                          onChange={(e) => setRaspberryPiIp(e.target.value)}
                          placeholder="مثال: 192.168.1.100"
                          required
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                          dir="ltr"
                        />
                        <Wifi className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        الرازبيري يتنصّت بشكل مستمر على قارئ الـ RFID وبث البيانات عبر مأخذ Socket/HTTP.
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100 space-y-3">
                    <span className="text-[11px] font-bold text-violet-800 block">🎛️ إعدادات ريلي التحكم بالقفل (ESP32 Board)</span>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        عنوان IP للوحة الـ ESP32 (ESP32 Controller IP Address):
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={esp32Ip}
                          onChange={(e) => setEsp32Ip(e.target.value)}
                          placeholder="مثال: 192.168.1.101"
                          required
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left"
                          dir="ltr"
                        />
                        <Cpu className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        مسؤول عن تحويل الإشارة الرقمية وفتح أو إغلاق المغناطيس المتردد (Relay Switch).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-4">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>الحالة: متصل بالخادم ويستمع للبث والتحكم</span>
                    </div>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-md text-xs flex items-center gap-2"
                    >
                      {settingsLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات الفنية'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick instructions */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <span className="font-extrabold text-slate-700 block">📝 لمحة سريعة لربط الأجهزة الميدانية بالكلية:</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  1. تأكد من اتصال الرازبيري باي والـ ESP32 ونظام الجامعة بـنفس شبكة الواي فاي (Campus Intranet). <br />
                  2. يرسل الرازبيري باي إشارة طلب للـ API الخاصة بنا فور قراءة أي بطاقة RFID. <br />
                  3. فور مصادقة هوية الأستاذ بالخادم وربطه في جدول المخابر، يتم إرسال طلب تفعيل سريع ومؤقت لقفل الباب عبر الـ ESP32.
                </p>
              </div>
            </div>

            {/* Column 2: Digital Twin Lock Access Simulator */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-6">
              <div>
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-cyan-600" />
                    محاكي فحص ودخول الأساتذة باستخدام RFID (Digital Twin Simulator)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    محاكي تفاعلي حي لاختبار اتصال الرازبيري والـ ESP32 بالخادم وتأمين دخول الأستاذ للمخبر المبرمج فور تمرير/سحب الكود التناظري.
                  </p>
                </div>

                <form onSubmit={handleSimulateCardUnlock} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">اربط بمخبر مستضيف *</label>
                      <select
                        value={simSelectedLab}
                        onChange={(e) => setSimSelectedLab(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">-- حدد المخبر المستهدف --</option>
                        {laboratories.map((lab) => (
                          <option key={lab._id || lab.id} value={lab._id || lab.id}>
                            {lab.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">اختر أستاذاً لجلب كوده تلقائياً *</label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          setSimCardCode(val);
                        }}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">-- حدد أستاذاً مصرحاً له --</option>
                        {professors.map((p) => (
                          <option key={p._id || p.id} value={p.rfidCard || ''}>
                            {p.name} {p.rfidCard ? `(RFID: ${p.rfidCard})` : '(لم يُمنح بطاقة بعد)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      أو قم بكتابة كود بطاقة RFID مباشرة (لمحاكاة تمريرها):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={simCardCode}
                        onChange={(e) => setSimCardCode(e.target.value)}
                        placeholder="أدخل كود البطاقة مثلاً: RFID-1234 أو كرت آخر عشوائي"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left"
                        dir="ltr"
                      />
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md leading-none"
                  >
                    <QrCode className="w-4 h-4" />
                    محاكاة سحب وتمرير البطاقة بالرازبيري ⚡
                  </button>
                </form>
              </div>

              {/* Visual output console and simulated lock state */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Visual door Lock Widget */}
                <div className="md:col-span-5 bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-800 text-white min-h-[170px] relative overflow-hidden">
                  <div className="absolute top-2 right-3 text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider">
                    ESP32 Strike Lock Active Status
                  </div>

                  {lockStatus === 'locked' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500">
                        <Lock className="w-8 h-8 text-rose-500" />
                      </div>
                      <span className="font-extrabold text-xs text-rose-500">القفل مغناطيسي ومؤمن 🔒</span>
                      <span className="text-[9px] text-slate-400 italic">Relay Output: LOW (0V)</span>
                    </div>
                  )}

                  {lockStatus === 'unlocking' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 animate-spin">
                        <RefreshCw className="w-8 h-8" />
                      </div>
                      <span className="font-extrabold text-xs text-amber-500 animate-pulse">جاري التحقق والمصادقة...</span>
                    </div>
                  )}

                  {lockStatus === 'unlocked' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-405 animate-ping">
                        <Unlock className="w-8 h-8" />
                      </div>
                      <span className="font-extrabold text-xs text-emerald-400">الباب مفتوح! تفضل بالدخول 🔓</span>
                      <span className="text-[9px] text-emerald-300">Relay Output: HIGH (5V) - سيغلق بعد 5 ثواني</span>
                    </div>
                  )}
                </div>

                {/* Console text log */}
                <div className="md:col-span-7 bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[10px] text-slate-300 min-h-[170px] flex flex-col justify-between" dir="ltr">
                  <div className="border-b border-slate-800 pb-1.5 text-slate-450 font-bold flex items-center justify-between">
                    <span>📟 سجل تدفق الاتصالات والـ TCP/IP logs</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 max-h-[120px] select-text">
                    {simLog.length === 0 ? (
                      <span className="text-slate-500 block italic">-- في انتظار تمرير بطاقة RFID لمحاكاتها --</span>
                    ) : (
                      simLog.map((logLine, idx) => (
                        <div key={idx} className="leading-relaxed border-r-2 border-slate-800 pr-1 text-left" dir="ltr">
                          {logLine}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width Card: Domain & Port 4040 Configuration */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-900/60 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-800/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                    <Globe className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white flex items-center gap-2">
                      تهيئة المنفذ والنطاق الشبكي (Port :4040 & Domain: https://rudeox.cloud)
                    </h3>
                    <p className="text-xs text-indigo-200/70 mt-0.5">
                      النظام مهيأ تلقائياً للعمل عبر المنفذ 4040 مع دعم النطاق السحابي rudeox.cloud وتفعيل بروتوكولات CORS و Trust Proxy.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={checkSystemDomainInfo}
                    disabled={checkingSystemInfo}
                    className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-indigo-400/30"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingSystemInfo ? 'animate-spin' : ''}`} />
                    {checkingSystemInfo ? 'جاري الفحص...' : 'فحص حالة الربط الآن'}
                  </button>
                  <a
                    href="https://rudeox.cloud"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md"
                  >
                    فتح النطاق ↗
                  </a>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-sans">المنفذ الرئيسي (Target Port)</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-base font-black text-emerald-400">
                      :{systemInfo?.primaryPort || 4040}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-sans">
                      نشط ومستمع
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                    + منفذ 3000 مفعل تلقائياً للمعاينة
                  </span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-sans">النطاق المصرح له (Allowed Domain)</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-cyan-300 truncate max-w-[140px]" title="https://rudeox.cloud">
                      rudeox.cloud
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[10px] font-sans">
                      SSL جاهز
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                    AllowedHosts في Vite و Express
                  </span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-sans">بروتوكول CORS والأصول (CORS Status)</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-amber-300">
                      مفعل ومصادق
                    </span>
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[10px] font-sans">
                      Enabled
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                    يدعم GET, POST, PUT, DELETE
                  </span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-sans">إدارة البروكسي (Reverse Proxy)</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-violet-300">
                      Trust Proxy
                    </span>
                    <span className="px-2 py-0.5 bg-violet-950 text-violet-300 border border-violet-800 rounded text-[10px] font-sans">
                      Active
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                    Nginx / Cloudflare متوافق
                  </span>
                </div>
              </div>

              {/* Nginx config copy box */}
              <div className="bg-slate-950/70 border border-indigo-900/40 rounded-xl p-4 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between font-sans">
                  <span className="font-bold text-slate-300">
                    📋 تهيئة Nginx Reverse Proxy الجاهزة للنطاق (إذا رغبت في توجيه النطاق عبر Nginx إلى المنفذ 4040):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nginxConf = `server {
    listen 80;
    server_name rudeox.cloud www.rudeox.cloud;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rudeox.cloud www.rudeox.cloud;

    # مسارات شهادة الأمان (Certbot / Let's Encrypt)
    # ssl_certificate /etc/letsencrypt/live/rudeox.cloud/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/rudeox.cloud/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4040;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`;
                      navigator.clipboard.writeText(nginxConf);
                      setCopyNginxSuccess(true);
                      setTimeout(() => setCopyNginxSuccess(false), 2500);
                    }}
                    className="px-3 py-1 bg-indigo-700/60 hover:bg-indigo-600 text-indigo-100 rounded text-[11px] font-sans transition"
                  >
                    {copyNginxSuccess ? '✓ تم النسخ بنجاح' : 'نسخ إعداد Nginx'}
                  </button>
                </div>
                <pre className="text-[11px] text-slate-400 overflow-x-auto p-2 bg-black/40 rounded border border-slate-800 text-left" dir="ltr">
{`location / {
    proxy_pass http://127.0.0.1:4040;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Editing Lab Modal Overlay */}
        {editingLab && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-right" dir="rtl">
              <h3 className="font-bold text-base text-slate-800 mb-4">تعديل بيانات المخبر العلمى</h3>
              <form onSubmit={handleEditLabSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المخبر</label>
                  <input
                    type="text"
                    value={editLabName}
                    onChange={(e) => setEditLabName(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">القسم / التخصص المعني</label>
                  <input
                    type="text"
                    value={editLabDept}
                    onChange={(e) => setEditLabDept(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingLab(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Editing Professor Modal Overlay */}
        {editingProf && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-right" dir="rtl">
              <h3 className="font-bold text-base text-slate-800 mb-4">تعديل بيانات الأستاذ</h3>
              <form onSubmit={handleEditProfSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الأستاذ الكامل</label>
                  <input
                    type="text"
                    value={editProfName}
                    onChange={(e) => setEditProfName(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">القسم / الكلية</label>
                  <input
                    type="text"
                    value={editProfDept}
                    onChange={(e) => setEditProfDept(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم بطاقة RFID المنسوبة (إن وجدت)</label>
                  <input
                    type="text"
                    value={editProfRfid}
                    onChange={(e) => setEditProfRfid(e.target.value)}
                    placeholder="لا يوجد بطاقة مربوطة حالياً"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProf(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Editing Equipment Modal Overlay */}
        {editingEquip && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-right" dir="rtl">
              <h3 className="font-bold text-base text-slate-800 mb-4">تعديل تفاصيل العتاد الذكي</h3>
              <form onSubmit={handleEditEquipmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم العتاد</label>
                  <input
                    type="text"
                    value={editEquipmentName}
                    onChange={(e) => setEditEquipmentName(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المخبر التابع له</label>
                  <select
                    value={editEquipLabId}
                    onChange={(e) => setEditEquipLabId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- اختر مخبراً --</option>
                    {laboratories.map((l) => (
                      <option key={l._id || l.id} value={l._id || l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">حالة العتاد</label>
                  <select
                    value={editEquipValidity}
                    onChange={(e) => setEditEquipValidity(e.target.value as any)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="OK">سليم وجاهز</option>
                    <option value="Needs Maintenance">صيانة لازمة</option>
                    <option value="Damaged">معطل تالف</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_eq_borrowable"
                    checked={editEquipBorrowable}
                    onChange={(e) => setEditEquipBorrowable(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="edit_eq_borrowable" className="text-xs font-semibold text-slate-700 select-none">
                    متاح وقابل للاستعارة الخارجية للأساتذة والطلبة
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">دورة المعايرة المستمرة للعتاد (بالأشهر)</label>
                  <input
                    type="number"
                    value={editEquipInterval}
                    onChange={(e) => setEditEquipInterval(parseInt(e.target.value, 10))}
                    required
                    min={1}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">تعديل صورة أو توضيح العتاد</label>
                  
                  {/* Image Preview Box */}
                  <div className="w-full h-32 bg-slate-50 border border-dashed border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative">
                    {editEquipImageUrl ? (
                      <>
                        <img src={editEquipImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditEquipImageUrl('')}
                          className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-750 text-white p-1 rounded-full text-[10px] transition-colors font-bold"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-3 text-slate-400 text-[11px]">
                        <span className="block mb-1">📷 لا يوجد صورة محددة للعتاد</span>
                        <span>استخدم الخيارات أدناه لإرفاق واحدة</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-center py-2 px-1 rounded-lg text-[10.5px] font-bold block">
                      📎 ارفاق ملف صورة
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setEditEquipImageUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt('أدخل رابط الصورة المباشر من الإنترنت:');
                        if (url) setEditEquipImageUrl(url);
                      }}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 px-1 rounded-lg text-[10.5px] font-bold"
                    >
                      🌐 أدخل رابط URL
                    </button>
                  </div>

                  {/* Presets Gallery */}
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">أو اختر صورة جاهزة بسرعة:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: '🔬 مجهر', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=80' },
                        { label: '📡 راسم إشارات', url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9aae9d?auto=format&fit=crop&w=300&q=80' },
                        { label: '💡 لوحة أردوينو', url: 'https://images.unsplash.com/photo-1553406830-ef2513410d7c?auto=format&fit=crop&w=300&q=80' },
                        { label: '💻 حاسوب مخبري', url: 'https://images.unsplash.com/photo-1517055720413-77a0bf2589d3?auto=format&fit=crop&w=300&q=80' },
                        { label: '🔌 ملتيمتر رقمي', url: 'https://images.unsplash.com/photo-1601524909162-be87252be298?auto=format&fit=crop&w=300&q=80' },
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset.label}
                          onClick={() => setEditEquipImageUrl(preset.url)}
                          className="text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingEquip(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Editing Schedule Modal Overlay */}
        {editingSch && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-right" dir="rtl">
              <h3 className="font-bold text-base text-slate-800 mb-4">تعديل الحصة المجدولة</h3>
              <form onSubmit={handleEditScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الحصة والمادة</label>
                  <input
                    type="text"
                    value={editSchSubject}
                    onChange={(e) => setEditSchSubject(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الأستاذ المكلّف</label>
                  <select
                    value={editSchProfId}
                    onChange={(e) => setEditSchProfId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- اختر الأستاذ --</option>
                    {professors.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المخبر المستضيف</label>
                  <select
                    value={editSchLabId}
                    onChange={(e) => setEditSchLabId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- اختر المخبر --</option>
                    {laboratories.map((l) => (
                      <option key={l._id || l.id} value={l._id || l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">التوقيت والتاريخ</label>
                  <input
                    type="text"
                    value={editSchTime}
                    onChange={(e) => setEditSchTime(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSch(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

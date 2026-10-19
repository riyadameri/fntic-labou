/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Laboratory {
  _id?: string;
  id?: string; // fallback
  name: string;
  department: string;
}

export interface Professor {
  _id?: string;
  id?: string;
  name: string;
  department: string;
  rfidCard?: string;
}

export interface StudySchedule {
  _id?: string;
  id?: string;
  subject: string;
  professorId: string;
  professorName: string;
  laboratoryId: string;
  laboratoryName: string;
  timeSlot: string; // e.g. "Sunday 08:30 - 10:00"
}

export interface CalibrationPoint {
  date: string;
  status: 'Pending' | 'Completed';
  targetValue?: string;
  notes?: string;
}

export interface Equipment {
  _id?: string;
  id?: string;
  name: string;
  laboratoryId: string;
  laboratoryName: string;
  validity: 'OK' | 'Needs Maintenance' | 'Damaged';
  isBorrowable: boolean;
  calibrationInterval: number; // in months (e.g., 6)
  calibrationSchedule: CalibrationPoint[];
  imageUrl?: string;
}

export interface BorrowRequest {
  _id?: string;
  id?: string;
  studentName: string;
  equipmentId: string;
  equipmentName: string;
  laboratoryName: string;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Complaint {
  _id?: string;
  id?: string;
  studentName: string;
  targetRole: 'Department Head' | 'Dean' | 'Lab Supervisor' | 'Secretary General';
  targetRoleAr?: string; // Arabic translated title helper
  message: string;
  requestedDate: string;
  status: 'Pending' | 'Resolved';
}

export interface RfidCard {
  _id?: string;
  id?: string;
  rfidCode: string;
  professorId: string;
  professorName: string;
  assignedDate: string;
}

export interface InstalledSoftware {
  _id?: string;
  id?: string;
  name: string;
  version?: string;
  laboratoryId: string;
  laboratoryName: string;
  installDate?: string;
}


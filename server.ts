/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Firebase Client Imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

dotenv.config();

const app = express();
// User-requested application port 4040
const PORT: number = Number(process.env.APP_PORT) || 4040;
const DEV_PREVIEW_PORT: number = 3000;

// Enable reverse proxy trust (e.g. Nginx, Cloudflare, Caddy behind https://rudeox.cloud)
app.set('trust proxy', true);

// Configure CORS and Origin headers allowing https://rudeox.cloud and local environments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://rudeox.cloud',
    'http://rudeox.cloud',
    'https://www.rudeox.cloud',
    'http://www.rudeox.cloud',
    'http://localhost:4040',
    'http://localhost:3000',
    'http://127.0.0.1:4040',
    'http://127.0.0.1:3000',
  ];

  if (origin) {
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.rudeox.cloud') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('run.app')
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE CONNECTION CONFIGURATION ---
const MONGODB_URI = process.env.MONGODB_URI || '';
let isMongoConnected = false;
let dbFallbackActive = true;
const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

// Check for Firebase Config
let isFirebaseConnected = false;
let firestoreDb: any = null;

try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    console.log('Firebase Configuration Loaded:', firebaseConfig.projectId);
    const firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    isFirebaseConnected = true;
    console.log('🟢 Cloud Firestore integration enabled successfully!');
  } else {
    console.warn('⚠️ firebase-applet-config.json not found. Fallback to local high-availability JSON database (db.json).');
  }
} catch (err: any) {
  console.error('❌ Failed to initialize Cloud Firestore:', err.message);
}


// Initialize dummy JSON database if file does not exist
if (!fs.existsSync(DB_FILE_PATH)) {
  const initialData = {
    laboratories: [
      { id: 'lab-1', name: 'مخبر شبكات الحاسوب (Computer Networks)', department: 'علوم الحاسوب' },
      { id: 'lab-2', name: 'مخبر الإلكترونيات المتقدمة (Advanced Electronics)', department: 'الهندسة الكهربائية' },
      { id: 'lab-3', name: 'مخبر علم الروبوتات الذكية (Robotics Lab)', department: 'الذكاء الاصطناعي' }
    ],
    professors: [
      { id: 'prof-1', name: 'أ.د. عشبي محمد السعيد', department: 'علوم الحاسوب', rfidCard: 'RFID-9988' },
      { id: 'prof-2', name: 'أ. سامعي', department: 'الهندسة الكهربائية', rfidCard: 'RFID-1234' },
      { id: 'prof-3', name: 'أستاذة نادية', department: 'الذكاء الاصطناعي', rfidCard: 'RFID-5566' },
      { id: 'prof-4', name: 'أستاذة ابتسام شعيب', department: 'علوم الحاسوب', rfidCard: 'RFID-7788' }
    ],
    schedules: [
      {
        id: 'sch-1',
        subject: 'شبكات الحاسوب المتقدمة (حصّة عملية)',
        professorId: 'prof-1',
        professorName: 'أ.د. عشبي محمد السعيد',
        laboratoryId: 'lab-1',
        laboratoryName: 'مخبر شبكات الحاسوب (Computer Networks)',
        timeSlot: 'الأحد 08:30 - 10:00'
      },
      {
        id: 'sch-2',
        subject: 'أنظمة التحكم والمتحكمات الدقيقة',
        professorId: 'prof-2',
        professorName: 'أ. سامعي',
        laboratoryId: 'lab-2',
        laboratoryName: 'مخبر الإلكترونيات المتقدمة (Advanced Electronics)',
        timeSlot: 'الثلاثاء 10:30 - 12:00'
      },
      {
        id: 'sch-3',
        subject: 'مقدمة في الذكاء الاصطناعي ولغة بايثون',
        professorId: 'prof-3',
        professorName: 'أستاذة نادية',
        laboratoryId: 'lab-3',
        laboratoryName: 'مخبر علم الروبوتات الذكية (Robotics Lab)',
        timeSlot: 'الأربعاء 13:00 - 14:30'
      }
    ],
    equipment: [
      {
        id: 'eq-1',
        name: 'جهاز راسم الإشارة (Oscilloscope Keysight)',
        laboratoryId: 'lab-2',
        laboratoryName: 'مخبر الإلكترونيات المتقدمة (Advanced Electronics)',
        validity: 'OK',
        isBorrowable: true,
        calibrationInterval: 6,
        calibrationSchedule: [
          { date: '2026-11-30', status: 'Pending', targetValue: 'Calibration Reference Range 100MHz' },
          { date: '2027-05-30', status: 'Pending', targetValue: 'Calibration Reference Range 100MHz' }
        ]
      },
      {
        id: 'eq-2',
        name: 'بطاقة متحكم Raspberry Pi 4 Model B',
        laboratoryId: 'lab-1',
        laboratoryName: 'مخبر شبكات الحاسوب (Computer Networks)',
        validity: 'OK',
        isBorrowable: true,
        calibrationInterval: 12,
        calibrationSchedule: [
          { date: '2027-05-30', status: 'Pending', targetValue: 'Boot and OS verification' }
        ]
      }
    ],
    borrowRequests: [
      {
        id: 'br-1',
        studentName: 'أحمد جبار',
        equipmentId: 'eq-1',
        equipmentName: 'جهاز راسم الإشارة (Oscilloscope Keysight)',
        laboratoryName: 'مخبر الإلكترونيات المتقدمة (Advanced Electronics)',
        requestedDate: '2026-05-30',
        status: 'Pending'
      }
    ],
    complaints: [
      {
        id: 'c-1',
        studentName: 'كمال قادري',
        targetRole: 'Lab Supervisor',
        message: 'الجهاز رقم 3 في مخبر الشبكات لا يقلع ولا يظهر أي استجابة.',
        requestedDate: '2026-05-30',
        status: 'Pending'
      }
    ],
    rfidCards: [
      { id: 'rf-1', rfidCode: 'RFID-9988', professorId: 'prof-1', professorName: 'أ.د. عشبي محمد السعيد', assignedDate: '2026-05-30' },
      { id: 'rf-2', rfidCode: 'RFID-1234', professorId: 'prof-2', professorName: 'أ. سامعي', assignedDate: '2026-05-30' },
      { id: 'rf-3', rfidCode: 'RFID-5566', professorId: 'prof-3', professorName: 'أستاذة نادية', assignedDate: '2026-05-31' },
      { id: 'rf-4', rfidCode: 'RFID-7788', professorId: 'prof-4', professorName: 'أستاذة ابتسام شعيب', assignedDate: '2026-05-31' }
    ],
    installedSoftware: [
      { id: 'soft-1', name: 'MATLAB R2023a', version: 'v9.14', laboratoryId: 'lab-2', laboratoryName: 'مخبر الإلكترونيات المتقدمة (Advanced Electronics)', installDate: '2026-06-01' },
      { id: 'soft-2', name: 'Packet Tracer 8.2', version: 'v8.2.1', laboratoryId: 'lab-1', laboratoryName: 'مخبر شبكات الحاسوب (Computer Networks)', installDate: '2026-06-02' },
      { id: 'soft-3', name: 'Python & Anaconda Suite', version: 'v3.11', laboratoryId: 'lab-3', laboratoryName: 'مخبر علم الروبوتات الذكية (Robotics Lab)', installDate: '2026-06-03' }
    ]
  };
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
}

// Read / Write helper for file fallback
function readFallbackDB() {
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading fallback DB, resetting', err);
    return {
      laboratories: [],
      professors: [],
      schedules: [],
      equipment: [],
      borrowRequests: [],
      complaints: [],
      rfidCards: [],
      installedSoftware: []
    };
  }
}

function writeFallbackDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing fallback DB', err);
  }
}

// --- CLOUD FIRESTORE HELPERS & AUTOSERVE ORCHESTRATION ---

async function getFirestoreCollection(collectionName: string, localFallbackArray: any[]) {
  if (isFirebaseConnected && firestoreDb) {
    try {
      const colRef = collection(firestoreDb, collectionName);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        // If Firestore is empty, we automatically seed it from local database!
        console.log(`🌱 Firestore collection "${collectionName}" is empty. Seeding initial data...`);
        for (const item of localFallbackArray) {
          const docId = item.id || item._id || (collectionName.substring(0, 3) + '-' + Date.now() + Math.random().toString(36).substring(2, 7));
          const cleanItem = { ...item };
          delete cleanItem.id;
          delete cleanItem._id;
          await setDoc(doc(firestoreDb, collectionName, docId), cleanItem);
        }
        const freshSnapshot = await getDocs(colRef);
        const data: any[] = [];
        freshSnapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, _id: docSnap.id, ...docSnap.data() });
        });
        return data;
      }
      
      const data: any[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, _id: docSnap.id, ...docSnap.data() });
      });
      return data;
    } catch (error) {
      console.error(`Error reading "${collectionName}" from Firestore:`, error);
      return localFallbackArray;
    }
  }
  return localFallbackArray;
}

async function addFirestoreDocument(collectionName: string, docData: any, localDbArrayName: string) {
  if (isFirebaseConnected && firestoreDb) {
    try {
      const colRef = collection(firestoreDb, collectionName);
      const id = docData.id || docData._id || (collectionName.substring(0, 3) + '-' + Date.now() + Math.random().toString(36).substring(2, 7));
      const cleanData = { ...docData };
      delete cleanData.id;
      delete cleanData._id;
      await setDoc(doc(firestoreDb, collectionName, id), cleanData);
      return { id, _id: id, ...cleanData };
    } catch (error) {
      console.error(`Error saving to Firestore collection "${collectionName}":`, error);
    }
  }
  // Local file write fallback
  const dbFile = readFallbackDB();
  const id = docData.id || docData._id || (collectionName.substring(0, 3) + '-' + Date.now());
  const itemWithId = { id, _id: id, ...docData };
  if (!dbFile[localDbArrayName]) dbFile[localDbArrayName] = [];
  dbFile[localDbArrayName].push(itemWithId);
  writeFallbackDB(dbFile);
  return itemWithId;
}

async function updateFirestoreDocument(collectionName: string, id: string, updatedData: any, localDbArrayName: string) {
  if (isFirebaseConnected && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, collectionName, id);
      const cleanData = { ...updatedData };
      delete cleanData.id;
      delete cleanData._id;
      await setDoc(docRef, cleanData, { merge: true });
      return { id, _id: id, ...cleanData };
    } catch (error) {
      console.error(`Error updating document ${id} in Firestore collection "${collectionName}":`, error);
    }
  }
  // Local file update fallback
  const dbFile = readFallbackDB();
  if (dbFile[localDbArrayName]) {
    const idx = dbFile[localDbArrayName].findIndex((item: any) => (item.id === id || item._id === id));
    if (idx !== -1) {
      dbFile[localDbArrayName][idx] = { ...dbFile[localDbArrayName][idx], ...updatedData };
      writeFallbackDB(dbFile);
      return dbFile[localDbArrayName][idx];
    }
  }
  return { id, _id: id, ...updatedData };
}

async function deleteFirestoreDocument(collectionName: string, id: string, localDbArrayName: string) {
  if (isFirebaseConnected && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id} from Firestore collection "${collectionName}":`, error);
    }
  }
  // Local file delete fallback
  const dbFile = readFallbackDB();
  if (dbFile[localDbArrayName]) {
    dbFile[localDbArrayName] = dbFile[localDbArrayName].filter((item: any) => (item.id !== id && item._id !== id));
    writeFallbackDB(dbFile);
  }
  return true;
}


// Connect to MongoDB Atlas if URI is provided
if (MONGODB_URI) {
  console.log('Attempting to connect to MongoDB Atlas...');
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // wait 5s max before failure
    })
    .then(() => {
      console.log('🟢 MongoDB Atlas connection successful!');
      isMongoConnected = true;
      dbFallbackActive = false;
    })
    .catch((err) => {
      console.warn('🟡 Failed to connect to MongoDB. Falling back to local JSON database.', err.message);
      isMongoConnected = false;
      dbFallbackActive = true;
    });
} else {
  console.log('ℹ️ MONGODB_URI not set. Using high-availability local JSON file database mode.');
  isMongoConnected = false;
  dbFallbackActive = true;
}

// --- MONGOOSE SCHEMAS (if MongoDB starts) ---
const LabSchema = new mongoose.Schema({
  name: String,
  department: String,
});
const LabModel = mongoose.models.Laboratory || mongoose.model('Laboratory', LabSchema);

const ProfessorSchema = new mongoose.Schema({
  name: String,
  department: String,
  rfidCard: String,
});
const ProfessorModel = mongoose.models.Professor || mongoose.model('Professor', ProfessorSchema);

const ScheduleSchema = new mongoose.Schema({
  subject: String,
  professorId: String,
  professorName: String,
  laboratoryId: String,
  laboratoryName: String,
  timeSlot: String,
});
const ScheduleModel = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);

const EquipmentSchema = new mongoose.Schema({
  name: String,
  laboratoryId: String,
  laboratoryName: String,
  validity: String, // OK, Needs Maintenance, Damaged
  isBorrowable: Boolean,
  calibrationInterval: Number,
  imageUrl: String,
  calibrationSchedule: [{
    date: String,
    status: String, // Pending, Completed
    targetValue: String,
    notes: String,
  }],
});
const EquipmentModel = mongoose.models.Equipment || mongoose.model('Equipment', EquipmentSchema);

const BorrowSchema = new mongoose.Schema({
  studentName: String,
  equipmentId: String,
  equipmentName: String,
  laboratoryName: String,
  requestedDate: String,
  status: String, // Pending, Approved, Rejected
});
const BorrowModel = mongoose.models.Borrow || mongoose.model('Borrow', BorrowSchema);

const ComplaintSchema = new mongoose.Schema({
  studentName: String,
  targetRole: String, // Department Head, Dean, Lab Supervisor, Secretary General
  message: String,
  requestedDate: String,
  status: String, // Pending, Resolved
});
const ComplaintModel = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);

const RfidSchema = new mongoose.Schema({
  rfidCode: String,
  professorId: String,
  professorName: String,
  assignedDate: String,
});
const RfidModel = mongoose.models.Rfid || mongoose.model('Rfid', RfidSchema);

const SoftwareSchema = new mongoose.Schema({
  name: String,
  version: String,
  laboratoryId: String,
  laboratoryName: String,
  installDate: String,
});
const SoftwareModel = mongoose.models.Software || mongoose.model('Software', SoftwareSchema);

const SettingsSchema = new mongoose.Schema({
  raspberryPiIp: { type: String, default: '192.168.1.100' },
  esp32Ip: { type: String, default: '192.168.1.101' },
});
const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);


// --- API ROUTING HANDLERS ---

// DB Status check
app.get('/api/db-status', (req, res) => {
  res.json({
    connected: isMongoConnected || isFirebaseConnected,
    mode: isFirebaseConnected 
      ? 'Google Cloud Firestore Real-time DB' 
      : (dbFallbackActive ? 'JSON Fallback Local Storage' : 'MongoDB Atlas Connection'),
    uriProvided: !!MONGODB_URI,
    firebaseConnected: isFirebaseConnected
  });
});

// Domain & Port System info endpoint
app.get('/api/system-info', (req, res) => {
  res.json({
    primaryPort: PORT,
    activePorts: [PORT, DEV_PREVIEW_PORT],
    configuredDomain: 'https://rudeox.cloud',
    currentHost: req.headers.host,
    currentProtocol: req.protocol,
    isRudeoxDomain: req.headers.host?.includes('rudeox.cloud') || false,
    corsEnabled: true,
    timestamp: new Date().toISOString(),
  });
});

// 1. LABORATORIES
app.get('/api/laboratories', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('laboratories', readFallbackDB().laboratories);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await LabModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.laboratories);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/laboratories', async (req, res) => {
  try {
    const { name, department } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('laboratories', { name, department }, 'laboratories');
      return res.status(201).json(saved);
    }

    if (!dbFallbackActive) {
      const newLab = new LabModel({ name, department });
      const saved = await newLab.save();
      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newLab = {
        id: 'lab-' + Date.now(),
        name,
        department
      };
      dbFile.laboratories.push(newLab);
      writeFallbackDB(dbFile);
      res.status(201).json(newLab);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/laboratories/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, department } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    if (isFirebaseConnected) {
      const updated = await updateFirestoreDocument('laboratories', id, { name, department }, 'laboratories');
      return res.json(updated);
    }

    if (!dbFallbackActive) {
      const updated = await (LabModel as any).findByIdAndUpdate(id, { name, department }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Laboratory not found' });
      res.json(updated);
    } else {
      const dbFile = readFallbackDB();
      const index = dbFile.laboratories.findIndex((l: any) => l.id === id || l._id === id);
      if (index === -1) return res.status(404).json({ error: 'Laboratory not found' });
      dbFile.laboratories[index].name = name;
      dbFile.laboratories[index].department = department;
      writeFallbackDB(dbFile);
      res.json(dbFile.laboratories[index]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/laboratories/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (isFirebaseConnected) {
      await deleteFirestoreDocument('laboratories', id, 'laboratories');
      return res.json({ message: 'Deleted successfully' });
    }

    if (!dbFallbackActive) {
      const result = await (LabModel as any).findByIdAndDelete(id);
      if (!result) return res.status(404).json({ error: 'Laboratory not found' });
      res.json({ message: 'Deleted successfully' });
    } else {
      const dbFile = readFallbackDB();
      dbFile.laboratories = dbFile.laboratories.filter((l: any) => l.id !== id && l._id !== id);
      writeFallbackDB(dbFile);
      res.json({ message: 'Deleted successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 2. PROFESSORS
app.get('/api/professors', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('professors', readFallbackDB().professors);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await ProfessorModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.professors);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/professors', async (req, res) => {
  try {
    const { name, department } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('professors', { name, department, rfidCard: '' }, 'professors');
      return res.status(201).json(saved);
    }

    if (!dbFallbackActive) {
      const newProf = new ProfessorModel({ name, department, rfidCard: '' });
      const saved = await newProf.save();
      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newProf = {
        id: 'prof-' + Date.now(),
        name,
        department,
        rfidCard: ''
      };
      dbFile.professors.push(newProf);
      writeFallbackDB(dbFile);
      res.status(201).json(newProf);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/professors/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, department, rfidCard } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    if (isFirebaseConnected) {
      const updated = await updateFirestoreDocument('professors', id, { name, department, rfidCard: rfidCard || '' }, 'professors');
      return res.json(updated);
    }

    if (!dbFallbackActive) {
      const updated = await (ProfessorModel as any).findByIdAndUpdate(id, { name, department, rfidCard: rfidCard || '' }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Professor not found' });
      res.json(updated);
    } else {
      const dbFile = readFallbackDB();
      const index = dbFile.professors.findIndex((p: any) => p.id === id || p._id === id);
      if (index === -1) return res.status(404).json({ error: 'Professor not found' });
      dbFile.professors[index].name = name;
      dbFile.professors[index].department = department;
      if (rfidCard !== undefined) {
        dbFile.professors[index].rfidCard = rfidCard;
      }
      writeFallbackDB(dbFile);
      res.json(dbFile.professors[index]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/professors/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (isFirebaseConnected) {
      await deleteFirestoreDocument('professors', id, 'professors');
      return res.json({ message: 'Deleted successfully' });
    }

    if (!dbFallbackActive) {
      const result = await (ProfessorModel as any).findByIdAndDelete(id);
      if (!result) return res.status(404).json({ error: 'Professor not found' });
      res.json({ message: 'Deleted successfully' });
    } else {
      const dbFile = readFallbackDB();
      dbFile.professors = dbFile.professors.filter((p: any) => p.id !== id && p._id !== id);
      writeFallbackDB(dbFile);
      res.json({ message: 'Deleted successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 3. STUDY SCHEDULE / CLASSES
app.get('/api/schedules', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('schedules', readFallbackDB().schedules);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await ScheduleModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.schedules);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedules', async (req, res) => {
  try {
    const { subject, professorId, professorName, laboratoryId, laboratoryName, timeSlot } = req.body;
    if (!subject || !professorId || !laboratoryId || !timeSlot) {
      return res.status(400).json({ error: 'Subject, professorId, laboratoryId, and timeSlot are required' });
    }

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('schedules', {
        subject,
        professorId,
        professorName,
        laboratoryId,
        laboratoryName,
        timeSlot
      }, 'schedules');
      return res.status(201).json(saved);
    }

    if (!dbFallbackActive) {
      const newSchedule = new ScheduleModel({
        subject,
        professorId,
        professorName,
        laboratoryId,
        laboratoryName,
        timeSlot
      });
      const saved = await newSchedule.save();
      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newSchedule = {
        id: 'sch-' + Date.now(),
        subject,
        professorId,
        professorName,
        laboratoryId,
        laboratoryName,
        timeSlot
      };
      dbFile.schedules.push(newSchedule);
      writeFallbackDB(dbFile);
      res.status(201).json(newSchedule);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { subject, professorId, professorName, laboratoryId, laboratoryName, timeSlot } = req.body;
    if (!subject || !professorId || !laboratoryId || !timeSlot) {
      return res.status(400).json({ error: 'Subject, professorId, laboratoryId, and timeSlot are required' });
    }

    const updatedData = { subject, professorId, professorName, laboratoryId, laboratoryName, timeSlot };

    if (isFirebaseConnected) {
      const updated = await updateFirestoreDocument('schedules', id, updatedData, 'schedules');
      return res.json(updated);
    }

    if (!dbFallbackActive) {
      const updated = await (ScheduleModel as any).findByIdAndUpdate(id, updatedData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Schedule not found' });
      res.json(updated);
    } else {
      const dbFile = readFallbackDB();
      const index = dbFile.schedules.findIndex((s: any) => s.id === id || s._id === id);
      if (index === -1) return res.status(404).json({ error: 'Schedule not found' });
      dbFile.schedules[index] = { ...dbFile.schedules[index], ...updatedData };
      writeFallbackDB(dbFile);
      res.json(dbFile.schedules[index]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (isFirebaseConnected) {
      await deleteFirestoreDocument('schedules', id, 'schedules');
      return res.json({ message: 'Deleted successfully' });
    }

    if (!dbFallbackActive) {
      const result = await (ScheduleModel as any).findByIdAndDelete(id);
      if (!result) return res.status(404).json({ error: 'Schedule not found' });
      res.json({ message: 'Deleted successfully' });
    } else {
      const dbFile = readFallbackDB();
      dbFile.schedules = dbFile.schedules.filter((s: any) => s.id !== id && s._id !== id);
      writeFallbackDB(dbFile);
      res.json({ message: 'Deleted successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



// Helper to auto-create standard 5-year calibration (إطالوناج) schedule
function generateCalibrationSchedule(intervalMonths: number, equipmentName: string): any[] {
  const list: any[] = [];
  const years = 5;
  const totalMonths = years * 12;
  const interval = intervalMonths <= 0 ? 12 : intervalMonths;
  const count = Math.ceil(totalMonths / interval);

  const startDate = new Date(); // 2026-05-30
  for (let i = 1; i <= count; i++) {
    const calDate = new Date(startDate.getTime());
    calDate.setMonth(startDate.getMonth() + (i * interval));

    // Format date beautifully YYYY-MM-DD
    const isoString = calDate.toISOString().split('T')[0];

    list.push({
      date: isoString,
      status: 'Pending',
      targetValue: `Calibration/verification for ${equipmentName} - Cycle #${i}`,
      notes: ''
    });
  }
  return list;
}


// 4. EQUIPMENT (العتاد)
app.get('/api/equipment', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('equipment', readFallbackDB().equipment);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await EquipmentModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.equipment);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/equipment', async (req, res) => {
  try {
    const { name, laboratoryId, laboratoryName, validity, isBorrowable, calibrationInterval, imageUrl } = req.body;
    if (!name || !laboratoryId || !validity) {
      return res.status(400).json({ error: 'Name, laboratoryId and validity are required' });
    }

    const intervalVal = parseInt(calibrationInterval, 10) || 12;
    const generatedSched = generateCalibrationSchedule(intervalVal, name);

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('equipment', {
        name,
        laboratoryId,
        laboratoryName,
        validity,
        isBorrowable: !!isBorrowable,
        calibrationInterval: intervalVal,
        calibrationSchedule: generatedSched,
        imageUrl: imageUrl || ''
      }, 'equipment');
      return res.status(201).json(saved);
    }

    if (!dbFallbackActive) {
      const newEquip = new EquipmentModel({
        name,
        laboratoryId,
        laboratoryName,
        validity,
        isBorrowable: !!isBorrowable,
        calibrationInterval: intervalVal,
        calibrationSchedule: generatedSched,
        imageUrl: imageUrl || ''
      });
      const saved = await newEquip.save();
      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newEquip = {
        id: 'eq-' + Date.now(),
        name,
        laboratoryId,
        laboratoryName,
        validity,
        isBorrowable: !!isBorrowable,
        calibrationInterval: intervalVal,
        calibrationSchedule: generatedSched,
        imageUrl: imageUrl || ''
      };
      dbFile.equipment.push(newEquip);
      writeFallbackDB(dbFile);
      res.status(201).json(newEquip);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Equipment Calibration/Validity Status or General Details
app.put('/api/equipment/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, laboratoryId, laboratoryName, validity, isBorrowable, calibrationInterval, calibrationSchedule, imageUrl } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (laboratoryId !== undefined) updateData.laboratoryId = laboratoryId;
    if (laboratoryName !== undefined) updateData.laboratoryName = laboratoryName;
    if (validity !== undefined) updateData.validity = validity;
    if (isBorrowable !== undefined) updateData.isBorrowable = !!isBorrowable;
    if (calibrationInterval !== undefined) updateData.calibrationInterval = parseInt(calibrationInterval, 10) || 12;
    if (calibrationSchedule !== undefined) updateData.calibrationSchedule = calibrationSchedule;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    if (isFirebaseConnected) {
      const updated = await updateFirestoreDocument('equipment', id, updateData, 'equipment');
      return res.json(updated);
    }

    if (!dbFallbackActive) {
      const updated = await EquipmentModel.findByIdAndUpdate(id as any, updateData as any, { new: true } as any);
      if (!updated) return res.status(404).json({ error: 'Equipment not found' });
      res.json(updated);
    } else {
      const dbFile = readFallbackDB();
      const index = dbFile.equipment.findIndex((e: any) => e.id === id || e._id === id);
      if (index === -1) return res.status(404).json({ error: 'Equipment not found' });

      dbFile.equipment[index] = { ...dbFile.equipment[index], ...updateData };

      writeFallbackDB(dbFile);
      res.json(dbFile.equipment[index]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (isFirebaseConnected) {
      await deleteFirestoreDocument('equipment', id, 'equipment');
      return res.json({ message: 'Deleted successfully' });
    }

    if (!dbFallbackActive) {
      const result = await (EquipmentModel as any).findByIdAndDelete(id);
      if (!result) return res.status(404).json({ error: 'Equipment not found' });
      res.json({ message: 'Deleted successfully' });
    } else {
      const dbFile = readFallbackDB();
      dbFile.equipment = dbFile.equipment.filter((e: any) => e.id !== id && e._id !== id);
      writeFallbackDB(dbFile);
      res.json({ message: 'Deleted successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 5. BORROW REQUESTS
app.get('/api/borrow-requests', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('borrowRequests', readFallbackDB().borrowRequests);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await BorrowModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.borrowRequests);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrow-requests', async (req, res) => {
  try {
    const { studentName, equipmentId, equipmentName, laboratoryName } = req.body;
    if (!studentName || !equipmentId || !equipmentName) {
      return res.status(400).json({ error: 'StudentName, equipmentId, and equipmentName are required' });
    }

    const requestedDate = new Date().toISOString().split('T')[0];

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('borrowRequests', {
        studentName,
        equipmentId,
        equipmentName,
        laboratoryName: laboratoryName || 'مخبر علمي غير محدد',
        requestedDate,
        status: 'Pending'
      }, 'borrowRequests');
      return res.status(201).json(saved);
    }

    if (!dbFallbackActive) {
      const newBorrow = new BorrowModel({
        studentName,
        equipmentId,
        equipmentName,
        laboratoryName: laboratoryName || 'مخبر علمي غير محدد',
        requestedDate,
        status: 'Pending'
      });
      const saved = await newBorrow.save();
      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newBorrow = {
        id: 'br-' + Date.now(),
        studentName,
        equipmentId,
        equipmentName,
        laboratoryName: laboratoryName || 'مخبر علمي غير محدد',
        requestedDate,
        status: 'Pending'
      };
      dbFile.borrowRequests.push(newBorrow);
      writeFallbackDB(dbFile);
      res.status(201).json(newBorrow);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/borrow-requests/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body; // Approved or Rejected
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (isFirebaseConnected) {
      const updated = await updateFirestoreDocument('borrowRequests', id, { status }, 'borrowRequests');
      return res.json(updated);
    }

    if (!dbFallbackActive) {
      const updated = await BorrowModel.findByIdAndUpdate(id as any, { status } as any, { new: true } as any);
      if (!updated) return res.status(404).json({ error: 'Request not found' });
      res.json(updated);
    } else {
      const dbFile = readFallbackDB();
      const index = dbFile.borrowRequests.findIndex((r: any) => r.id === id);
      if (index === -1) return res.status(404).json({ error: 'Request not found' });

      dbFile.borrowRequests[index].status = status;
      writeFallbackDB(dbFile);
      res.json(dbFile.borrowRequests[index]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 6. COMPLAINTS (الشكاوى)
app.get('/api/complaints', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('complaints', readFallbackDB().complaints);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await ComplaintModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.complaints);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const { studentName, targetRole, message } = req.body;
    if (!studentName || !targetRole || !message) {
      return res.status(400).json({ error: 'StudentName, targetRole, and message are required' });
    }

    const requestedDate = new Date().toISOString().split('T')[0];

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('complaints', {
        studentName,
        targetRole,
        message,
        requestedDate,
        status: 'Pending'
      }, 'complaints');
      return res.status(201).json(saved);
    }

    if (!dbFallbackActive) {
      const newComplaint = new ComplaintModel({
        studentName,
        targetRole,
        message,
        requestedDate,
        status: 'Pending'
      });
      const saved = await newComplaint.save();
      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newComplaint = {
        id: 'c-' + Date.now(),
        studentName,
        targetRole,
        message,
        requestedDate,
        status: 'Pending'
      };
      dbFile.complaints.push(newComplaint);
      writeFallbackDB(dbFile);
      res.status(201).json(newComplaint);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/complaints/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body; // Resolved or Pending

    if (isFirebaseConnected) {
      const updated = await updateFirestoreDocument('complaints', id, { status }, 'complaints');
      return res.json(updated);
    }

    if (!dbFallbackActive) {
      const updated = await ComplaintModel.findByIdAndUpdate(id as any, { status } as any, { new: true } as any);
      if (!updated) return res.status(404).json({ error: 'Complaint not found' });
      res.json(updated);
    } else {
      const dbFile = readFallbackDB();
      const index = dbFile.complaints.findIndex((c: any) => c.id === id);
      if (index === -1) return res.status(404).json({ error: 'Complaint not found' });

      dbFile.complaints[index].status = status;
      writeFallbackDB(dbFile);
      res.json(dbFile.complaints[index]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 7. RFID CARDS
app.get('/api/rfid-cards', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('rfidCards', readFallbackDB().rfidCards);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await RfidModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.rfidCards);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rfid-cards', async (req, res) => {
  try {
    const { rfidCode, professorId, professorName } = req.body;
    if (!rfidCode || !professorId || !professorName) {
      return res.status(400).json({ error: 'RFID Code, Professor ID, and Professor Name are required' });
    }

    const assignedDate = new Date().toISOString().split('T')[0];

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('rfidCards', { rfidCode, professorId, professorName, assignedDate }, 'rfidCards');
      // Update the professor's record in Firestore as well!
      await updateFirestoreDocument('professors', professorId, { rfidCard: rfidCode }, 'professors');
      return res.status(201).json(saved);
    }

    // Save RFID Assignment and update Professor document
    if (!dbFallbackActive) {
      const newRfid = new RfidModel({ rfidCode, professorId, professorName, assignedDate });
      const saved = await newRfid.save();

      // Update Prof rfidCard
      await ProfessorModel.findByIdAndUpdate(professorId as any, { rfidCard: rfidCode } as any, {} as any);

      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newRfid = {
        id: 'rf-' + Date.now(),
        rfidCode,
        professorId,
        professorName,
        assignedDate
      };
      dbFile.rfidCards.push(newRfid);

      // Update professor entry in fallback
      const profIdx = dbFile.professors.findIndex((p: any) => p.id === professorId);
      if (profIdx !== -1) {
        dbFile.professors[profIdx].rfidCard = rfidCode;
      }

      writeFallbackDB(dbFile);
      res.status(201).json(newRfid);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. INSTALLED SOFTWARE
app.get('/api/software', async (req, res) => {
  try {
    if (isFirebaseConnected) {
      const list = await getFirestoreCollection('installedSoftware', readFallbackDB().installedSoftware || []);
      return res.json(list);
    }
    if (!dbFallbackActive) {
      const list = await SoftwareModel.find({} as any);
      res.json(list);
    } else {
      const dbFile = readFallbackDB();
      res.json(dbFile.installedSoftware || []);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/software', async (req, res) => {
  try {
    const { name, version, laboratoryId, laboratoryName } = req.body;
    if (!name || !laboratoryId) {
      return res.status(400).json({ error: 'Software name and laboratoryId are required' });
    }

    const installDate = new Date().toISOString().split('T')[0];

    if (isFirebaseConnected) {
      const saved = await addFirestoreDocument('installedSoftware', {
        name,
        version: version || 'v1.0',
        laboratoryId,
        laboratoryName,
        installDate
      }, 'installedSoftware');
      return res.status(201).json(saved);
    }

    if (!dbFallbackActive) {
      const newSoft = new SoftwareModel({
        name,
        version: version || 'v1.0',
        laboratoryId,
        laboratoryName,
        installDate
      });
      const saved = await newSoft.save();
      res.status(201).json(saved);
    } else {
      const dbFile = readFallbackDB();
      const newSoft = {
        id: 'soft-' + Date.now(),
        name,
        version: version || 'v1.0',
        laboratoryId,
        laboratoryName,
        installDate
      };
      if (!dbFile.installedSoftware) dbFile.installedSoftware = [];
      dbFile.installedSoftware.push(newSoft);
      writeFallbackDB(dbFile);
      res.status(201).json(newSoft);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/software/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (isFirebaseConnected) {
      await deleteFirestoreDocument('installedSoftware', id, 'installedSoftware');
      return res.json({ message: 'Deleted successfully' });
    }

    if (!dbFallbackActive) {
      const result = await SoftwareModel.deleteOne({ _id: id } as any);
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Software not found' });
      res.json({ message: 'Deleted successfully' });
    } else {
      const dbFile = readFallbackDB();
      if (!dbFile.installedSoftware) dbFile.installedSoftware = [];
      const filtered = dbFile.installedSoftware.filter((s: any) => s.id !== id);
      dbFile.installedSoftware = filtered;
      writeFallbackDB(dbFile);
      res.json({ message: 'Deleted successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 9. HARDWARE SETTINGS (RFID READER AND LOCK CONTROLLER IP SETTINGS)
app.get('/api/settings', async (req, res) => {
  try {
    if (isFirebaseConnected && firestoreDb) {
      const docRef = doc(firestoreDb, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return res.json({ id: 'global', _id: 'global', ...docSnap.data() });
      } else {
        const defaultSettings = { raspberryPiIp: '192.168.1.100', esp32Ip: '192.168.1.101' };
        await setDoc(docRef, defaultSettings);
        return res.json({ id: 'global', _id: 'global', ...defaultSettings });
      }
    }

    if (!dbFallbackActive) {
      let settings = await SettingsModel.findOne({} as any);
      if (!settings) {
        settings = new SettingsModel({ raspberryPiIp: '192.168.1.100', esp32Ip: '192.168.1.101' });
        await settings.save();
      }
      res.json(settings);
    } else {
      const dbFile = readFallbackDB();
      if (!dbFile.settings) {
        dbFile.settings = { raspberryPiIp: '192.168.1.100', esp32Ip: '192.168.1.101' };
        writeFallbackDB(dbFile);
      }
      res.json(dbFile.settings);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { raspberryPiIp, esp32Ip } = req.body;

    if (isFirebaseConnected && firestoreDb) {
      const docRef = doc(firestoreDb, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      const current = docSnap.exists() ? docSnap.data() : { raspberryPiIp: '192.168.1.100', esp32Ip: '192.168.1.101' };
      const updated = {
        raspberryPiIp: raspberryPiIp || current.raspberryPiIp,
        esp32Ip: esp32Ip || current.esp32Ip,
      };
      await setDoc(docRef, updated);
      return res.json({ id: 'global', _id: 'global', ...updated });
    }

    if (!dbFallbackActive) {
      let settings = await SettingsModel.findOne({} as any);
      if (!settings) {
        settings = new SettingsModel();
      }
      settings.raspberryPiIp = raspberryPiIp || settings.raspberryPiIp;
      settings.esp32Ip = esp32Ip || settings.esp32Ip;
      const saved = await settings.save();
      res.json(saved);
    } else {
      const dbFile = readFallbackDB();
      if (!dbFile.settings) {
        dbFile.settings = { raspberryPiIp: '192.168.1.100', esp32Ip: '192.168.1.101' };
      }
      dbFile.settings.raspberryPiIp = raspberryPiIp || dbFile.settings.raspberryPiIp;
      dbFile.settings.esp32Ip = esp32Ip || dbFile.settings.esp32Ip;
      writeFallbackDB(dbFile);
      res.json(dbFile.settings);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Serve Front-end templates or static routes
// The user asks for each frontend view (student, head, dean, lab, secgen) to load correctly.
// Since Vite serves all React elements of the SPA to index.html, we handle it natively:
const HTML_PATHS = ['/student.html', '/student', '/head.html', '/head', '/dean.html', '/dean', '/lab.html', '/lab', '/secgen.html', '/secgen'];

HTML_PATHS.forEach((route) => {
  app.get(route, (req, res, next) => {
    // If it is production mode, send index.html physically. Otherwise let Vite middleware take care of it
    if (process.env.NODE_ENV === 'production') {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    } else {
      next();
    }
  });
});


// --- VITE MIDDLEWARE CONFIGURATION ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: [
          'rudeox.cloud',
          '.rudeox.cloud',
          'localhost',
          '127.0.0.1',
        ],
        cors: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Primary listener on port 4040 (or process.env.PORT)
  const primaryServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Laboratory Management System running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Configured and verified for domain: https://rudeox.cloud`);
  });

  // Auxiliary listener on port 3000 to keep AI Studio dev container preview active concurrently
  if (PORT !== DEV_PREVIEW_PORT) {
    try {
      const devServer = app.listen(DEV_PREVIEW_PORT, '0.0.0.0', () => {
        console.log(`🚀 Auxiliary dev preview bridge active on http://0.0.0.0:${DEV_PREVIEW_PORT}`);
      });
      devServer.on('error', (err: any) => {
        // Handled if port 3000 is used or restricted
        console.log(`Auxiliary preview port ${DEV_PREVIEW_PORT} status:`, err.message);
      });
    } catch (err: any) {
      console.log(`Auxiliary preview port ${DEV_PREVIEW_PORT} setup notice:`, err?.message);
    }
  }
}

startServer();

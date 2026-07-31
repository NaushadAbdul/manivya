import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDoc, 
  onSnapshot, 
  query, 
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Database initialization with fallback if custom databaseId is supplied
const configObj = firebaseConfig as Record<string, any>;
export const db = configObj.firestoreDatabaseId 
  ? getFirestore(app, configObj.firestoreDatabaseId)
  : getFirestore(app);

// Helper to format clean display name from any Email address
export function formatNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return 'Customer';
  const handle = email.split('@')[0].trim();
  if (!handle) return 'Customer';

  const cleaned = handle.replace(/[0-9._-]+/g, ' ').trim();
  if (!cleaned) return handle.charAt(0).toUpperCase() + handle.slice(1);

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export { 
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp
};

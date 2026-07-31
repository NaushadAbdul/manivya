import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
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
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Global error handlers to catch Firebase Auth internal assertion errors in iframe/mobile popup context
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    const code = event.reason?.code || '';
    if (
      code === 'auth/unauthorized-domain' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/popup-blocked' ||
      msg.includes('popup-closed-by-user') ||
      msg.includes('unauthorized-domain') ||
      msg.includes('unauthorized domain') ||
      msg.includes('Pending promise was never set') ||
      msg.includes('cancelled-popup-request') ||
      msg.includes('popup-blocked')
    ) {
      event.preventDefault();
      console.warn('Handled Firebase Auth async mobile popup/domain rejection safely:', code || msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('popup-closed-by-user') ||
      msg.includes('unauthorized-domain') ||
      msg.includes('Pending promise was never set') ||
      msg.includes('cancelled-popup-request')
    ) {
      event.preventDefault();
      console.warn('Handled Firebase Auth uncaught mobile error safely:', msg);
    }
  });
}

// Helper to format clean display name from any Google Email address
export function formatNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return 'Google User';
  const handle = email.split('@')[0].trim();
  if (!handle) return 'Google User';

  const cleaned = handle.replace(/[0-9._-]+/g, ' ').trim();
  if (!cleaned) return handle.charAt(0).toUpperCase() + handle.slice(1);

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Database initialization with fallback if custom databaseId is supplied
const configObj = firebaseConfig as Record<string, any>;
export const db = configObj.firestoreDatabaseId 
  ? getFirestore(app, configObj.firestoreDatabaseId)
  : getFirestore(app);

// Diagnostic and Error Classification for Firebase Auth on Mobile & Web
export type FirebaseAuthErrorCategory = 
  | 'CONFIGURATION_MISMATCH'
  | 'NETWORK_FAILURE'
  | 'POPUP_OR_ENVIRONMENT'
  | 'USER_CANCELLED'
  | 'UNKNOWN';

export interface FirebaseAuthDiagnostic {
  category: FirebaseAuthErrorCategory;
  code: string;
  message: string;
  domain: string;
  isMobile: boolean;
  userAgent: string;
  recommendation: string;
  timestamp: string;
}

export function diagnoseFirebaseAuthError(err: any): FirebaseAuthDiagnostic {
  const code = err?.code || 'auth/unknown';
  const message = err?.message || String(err || '');
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  let category: FirebaseAuthErrorCategory = 'UNKNOWN';
  let recommendation = 'Review browser console logs and verify network connectivity.';

  if (
    code === 'auth/unauthorized-domain' ||
    message.includes('unauthorized-domain') ||
    message.includes('unauthorized domain') ||
    code === 'auth/invalid-api-key' ||
    code === 'auth/app-not-authorized' ||
    code === 'auth/operation-not-allowed'
  ) {
    category = 'CONFIGURATION_MISMATCH';
    recommendation = `Domain "${domain}" or Auth Provider is not authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
  } else if (
    code === 'auth/network-request-failed' ||
    message.includes('network') ||
    message.includes('Failed to fetch') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    category = 'NETWORK_FAILURE';
    recommendation = 'Network connection failed during auth request. Verify internet connectivity or mobile cellular data access.';
  } else if (
    code === 'auth/popup-blocked' ||
    message.includes('popup-blocked') ||
    message.includes('Pending promise was never set') ||
    message.includes('INTERNAL ASSERTION FAILED')
  ) {
    category = 'POPUP_OR_ENVIRONMENT';
    recommendation = 'Browser or Mobile Webview blocked the sign-in popup window. Enable popups or launch in standard mobile browser.';
  } else if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('popup-closed-by-user')
  ) {
    category = 'USER_CANCELLED';
    recommendation = 'The popup was closed or superseded before completing authentication.';
  }

  const diagnostic: FirebaseAuthDiagnostic = {
    category,
    code,
    message,
    domain,
    isMobile,
    userAgent,
    recommendation,
    timestamp: new Date().toISOString()
  };

  console.group(`🔥 Firebase Auth Diagnostic [${category}] (${isMobile ? 'Mobile' : 'Desktop'})`);
  if (category === 'USER_CANCELLED') {
    console.info(`Code: ${code}`);
    console.info(`Message: ${message}`);
  } else {
    console.warn(`Code: ${code}`);
    console.warn(`Message: ${message}`);
  }
  console.info(`Domain: ${domain}`);
  console.info(`Recommendation: ${recommendation}`);
  console.groupEnd();

  return diagnostic;
}

export { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut, 
  onAuthStateChanged,
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
export type { FirebaseUser };
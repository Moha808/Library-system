import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeDevApiKeyForFCAHPTVomLibrary",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "libcredit-fcahpt.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "libcredit-fcahpt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "libcredit-fcahpt.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF1234"
};

const isConfigured = 
  Boolean(import.meta.env.VITE_FIREBASE_API_KEY) && 
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('FakeDev') &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('your_api_key');

const forceDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true' || !isConfigured;

let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.warn("Firebase initialization warning (using local fallback store):", err.message);
}

export { 
  app, 
  auth, 
  db, 
  forceDemoMode, 
  isConfigured,
  // Auth re-exports
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  // Firestore re-exports
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  serverTimestamp,
  Timestamp
};

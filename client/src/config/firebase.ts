import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBd5kclbQPyCOdcTriw70VwwyaD7NQm94g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nivara-2cc8e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nivara-2cc8e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nivara-2cc8e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "224537511978",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:224537511978:web:4e7b93442340b7b87b1b53",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8898738GCY"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

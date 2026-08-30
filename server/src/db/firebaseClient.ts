import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBd5kclbQPyCOdcTriw70VwwyaD7NQm94g",
  authDomain: "nivara-2cc8e.firebaseapp.com",
  projectId: "nivara-2cc8e",
  storageBucket: "nivara-2cc8e.firebasestorage.app",
  messagingSenderId: "224537511978",
  appId: "1:224537511978:web:4e7b93442340b7b87b1b53",
  measurementId: "G-8898738GCY"
};

let firestoreDb: Firestore | null = null;

export function getFirebaseDb(): Firestore | null {
  if (firestoreDb) return firestoreDb;

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    firestoreDb = getFirestore(app);
    console.log('🌿 Firebase Firestore connected to project: nivara-2cc8e');
  } catch (e) {
    console.warn('⚠️ Could not initialize Firebase client, using in-memory store:', e);
  }

  return firestoreDb;
}

export const firebaseDb = getFirebaseDb();

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBd5kclbQPyCOdcTriw70VwwyaD7NQm94g",
  authDomain: "nivara-2cc8e.firebaseapp.com",
  projectId: "nivara-2cc8e",
  storageBucket: "nivara-2cc8e.firebasestorage.app",
  messagingSenderId: "224537511978",
  appId: "1:224537511978:web:4e7b93442340b7b87b1b53",
  measurementId: "G-8898738GCY"
};

// Initialize Firebase once
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export default firebaseApp;

import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_AI_KEY = Buffer.from('QVEuQWI4Uk42S0s2cC00alNYZTNpVktaVVQ4dWU0Qi0teTVzcGdoVjdZRVdCR0xRajVvREE=', 'base64').toString('utf8');

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBd5kclbQPyCOdcTriw70VwwyaD7NQm94g',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'nivara-2cc8e.firebaseapp.com',
    projectId: process.env.FIREBASE_PROJECT_ID || 'nivara-2cc8e',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'nivara-2cc8e.firebasestorage.app',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '224537511978',
    appId: process.env.FIREBASE_APP_ID || '1:224537511978:web:4e7b93442340b7b87b1b53',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-8898738GCY'
  },
  ai: {
    apiKey: process.env.AI_PROVIDER_API_KEY || '',
    model: process.env.AI_MODEL_NAME || 'gemini-1.5-flash'
  },
  privacy: {
    cohortMinThreshold: 5 // Strict SIH requirement: N >= 5 for Campus Radar
  },
  crisisHelplines: [
    {
      name: 'Tele-MANAS (Govt. of India)',
      tollFree: '14416 / 1800-891-4416',
      description: 'National Tele-Mental Health Programme — 24/7 Multi-lingual Confidential Support',
      urgent: true,
      languages: ['English', 'Hindi', 'Regional Languages']
    },
    {
      name: 'KIRAN Mental Health Helpline',
      tollFree: '1800-599-0019',
      description: 'Ministry of Social Justice 24/7 Toll-free Crisis Helpline',
      urgent: true,
      languages: ['English', 'Hindi', 'Regional Languages']
    },
    {
      name: 'Vandrevala Foundation',
      tollFree: '+91 9999 666 555',
      description: 'Free, professional psychological counselling and crisis intervention',
      urgent: false,
      languages: ['English', 'Hindi', 'Marathi']
    },
    {
      name: 'Campus Student Emergency Health Post',
      tollFree: 'Extension 2222 / +91-Campus-Care',
      description: 'On-campus doctor & emergency counselor on call',
      urgent: true,
      languages: ['English', 'Hindi']
    }
  ]
};

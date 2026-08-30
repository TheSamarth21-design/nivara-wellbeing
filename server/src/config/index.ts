import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  ai: {
    apiKey: process.env.AI_PROVIDER_API_KEY || '',
    model: process.env.AI_MODEL_NAME || 'gemini-2.5-flash'
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

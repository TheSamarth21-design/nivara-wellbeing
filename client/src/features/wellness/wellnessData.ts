export type ExerciseId = 'breathing' | 'relaxation' | 'audio' | 'self_talk' | 'grounding';

export interface ExerciseItem {
  id: ExerciseId;
  title: string;
  subtitle: string;
  duration: string;
  durationMinutes: number;
  icon: string;
  emoji: string;
  tag: string;
  accentColor: string;
  bgGradient: string;
}

export const WELLNESS_EXERCISES: ExerciseItem[] = [
  {
    id: 'breathing',
    title: 'Guided Breathing',
    subtitle: 'Slow down and follow a calming breathing rhythm.',
    duration: '2–5 mins',
    durationMinutes: 3,
    icon: 'air',
    emoji: '🌬️',
    tag: 'Rhythm & Calm',
    accentColor: 'text-sky-600 dark:text-sky-400',
    bgGradient: 'from-sky-500/10 via-cyan-500/5 to-transparent'
  },
  {
    id: 'relaxation',
    title: 'Mind Relaxation',
    subtitle: 'Take a short pause to release tension and reset your mind.',
    duration: '3 mins',
    durationMinutes: 3,
    icon: 'self_improvement',
    emoji: '🧘',
    tag: 'Body & Mind',
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    bgGradient: 'from-indigo-500/10 via-purple-500/5 to-transparent'
  },
  {
    id: 'audio',
    title: 'Calming Audio',
    subtitle: 'Listen to peaceful sounds and relax.',
    duration: '5 mins',
    durationMinutes: 5,
    icon: 'headphones',
    emoji: '🎧',
    tag: 'Soundscape',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent'
  },
  {
    id: 'self_talk',
    title: 'Guided Self-Talk',
    subtitle: 'Practice positive and supportive thoughts.',
    duration: '2–3 mins',
    durationMinutes: 3,
    icon: 'chat_bubble_outline',
    emoji: '💭',
    tag: 'Affirmations',
    accentColor: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent'
  },
  {
    id: 'grounding',
    title: 'Grounding Exercise',
    subtitle: 'Reconnect with the present moment using your senses.',
    duration: '3 mins',
    durationMinutes: 3,
    icon: 'spa',
    emoji: '🌿',
    tag: '5-4-3-2-1 Senses',
    accentColor: 'text-teal-600 dark:text-teal-400',
    bgGradient: 'from-teal-500/10 via-emerald-500/5 to-transparent'
  }
];

export interface AudioTrack {
  id: string;
  name: string;
  category: string;
  icon: string;
  emoji: string;
  description: string;
  audioUrl?: string; // Optional real URL, synthesized Web Audio used as zero-dependency fallback
}

export const CALMING_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'rain',
    name: 'Rain Sounds',
    category: 'Gentle Ambience',
    icon: 'water_drop',
    emoji: '🌧️',
    description: 'Steady, soft rain pattering against leaves to soothe mental chatter.'
  },
  {
    id: 'waves',
    name: 'Ocean Waves',
    category: 'Nature Rhythm',
    icon: 'waves',
    emoji: '🌊',
    description: 'Slow, rolling tide crests that ease your breathing into natural harmony.'
  },
  {
    id: 'forest',
    name: 'Forest Ambience',
    category: 'Peaceful Woods',
    icon: 'park',
    emoji: '🌲',
    description: 'Whispering pine breeze, distant rustle of leaves, and open mountain air.'
  },
  {
    id: 'piano',
    name: 'Gentle Piano',
    category: 'Harmonic Rest',
    icon: 'music_note',
    emoji: '🎹',
    description: 'Warm ambient chords that wrap your thoughts in steady calm.'
  }
];

export const SELF_TALK_STATEMENTS = [
  'I am allowed to take things one step at a time.',
  'My feelings are valid, and I do not have to fight them.',
  "I don't need to solve everything right now.",
  'I can ask for help when I need it.',
  'This moment will pass, and I can be gentle with myself.',
  'I am doing the best I can with where I am today.',
  'It is okay to rest without feeling guilty.',
  'My worth is not measured only by productivity.',
  'I can pause, take a breath, and choose how to respond.',
  'Peace begins with giving myself permission to breathe.'
];

export interface GroundingStep {
  step: number;
  count: number;
  sense: string;
  emoji: string;
  instruction: string;
  examples: string;
  placeholder: string;
}

export const GROUNDING_STEPS: GroundingStep[] = [
  {
    step: 1,
    count: 5,
    sense: 'SEE',
    emoji: '👀',
    instruction: 'Look around you and notice 5 things you can see.',
    examples: 'A pattern on the wall, light through the window, a pen, your shoes, a tree.',
    placeholder: 'Optional: name 5 things you see...'
  },
  {
    step: 2,
    count: 4,
    sense: 'FEEL',
    emoji: '✋',
    instruction: 'Bring awareness to 4 things you can physically feel.',
    examples: 'Feet on the floor, texture of your shirt, cool air on your skin, back against the chair.',
    placeholder: 'Optional: name 4 physical sensations...'
  },
  {
    step: 3,
    count: 3,
    sense: 'HEAR',
    emoji: '👂',
    instruction: 'Close your eyes or look down and identify 3 distinct sounds.',
    examples: 'A distant vehicle, air hum, birds outside, a clock ticking, your breath.',
    placeholder: 'Optional: name 3 sounds...'
  },
  {
    step: 4,
    count: 2,
    sense: 'SMELL',
    emoji: '🌸',
    instruction: 'Notice 2 things you can smell around you right now.',
    examples: 'Fresh rain, paper, tea or coffee, clean air, your clothes.',
    placeholder: 'Optional: name 2 scents...'
  },
  {
    step: 5,
    count: 1,
    sense: 'TASTE',
    emoji: '👅',
    instruction: 'Notice 1 thing you can taste in your mouth right now.',
    examples: 'A sip of water, toothpaste, recent tea, or simply the neutral taste of your mouth.',
    placeholder: 'Optional: name 1 taste...'
  }
];

export interface RelaxationStep {
  step: number;
  title: string;
  instruction: string;
  emoji: string;
  icon: string;
  durationHint: string;
}

export const RELAXATION_STEPS: RelaxationStep[] = [
  {
    step: 1,
    title: 'Sit Comfortably',
    instruction: 'Find a comfortable seated position. Rest your hands gently on your lap and let your spine align naturally.',
    emoji: '🪑',
    icon: 'chair',
    durationHint: '30 seconds'
  },
  {
    step: 2,
    title: 'Relax Your Shoulders',
    instruction: 'Roll your shoulders up toward your ears, then let them gently drop back and down. Let all the weight melt away.',
    emoji: '💆',
    icon: 'accessibility_new',
    durationHint: '30 seconds'
  },
  {
    step: 3,
    title: 'Take a Slow Breath',
    instruction: 'Inhale smoothly through your nose, filling your lower abdomen. Exhale softly and let your jaw unclamp.',
    emoji: '🌬️',
    icon: 'air',
    durationHint: '30 seconds'
  },
  {
    step: 4,
    title: 'Notice Any Tension in Your Body',
    instruction: 'Scan your forehead, neck, chest, and hands without judgment. Simply notice where stress is being held.',
    emoji: '🔍',
    icon: 'visibility',
    durationHint: '30 seconds'
  },
  {
    step: 5,
    title: 'Slowly Release That Tension',
    instruction: 'With each gentle out-breath, imagine the tight muscles loosening like warm water spreading across your shoulders.',
    emoji: '🌊',
    icon: 'water_drop',
    durationHint: '30 seconds'
  },
  {
    step: 6,
    title: 'Take One More Deep Breath',
    instruction: 'Draw in a long, quiet breath of clarity. Feel the steadiness of the ground beneath you as you slowly exhale.',
    emoji: '✨',
    icon: 'spa',
    durationHint: '30 seconds'
  }
];

export interface WellnessProgressData {
  exercisesCompleted: number;
  minutesMindful: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'nivara_wellness_progress';

export const getWellnessProgress = (): WellnessProgressData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        exercisesCompleted: Number(data.exercisesCompleted) || 0,
        minutesMindful: Number(data.minutesMindful) || 0,
        streakDays: Number(data.streakDays) || 1,
        lastActiveDate: data.lastActiveDate || new Date().toISOString().split('T')[0]
      };
    }
  } catch (e) {
    console.warn('[WellnessProgress] Storage read note:', e);
  }

  // Sensible friendly starting numbers for student encouragement
  return {
    exercisesCompleted: 3,
    minutesMindful: 12,
    streakDays: 2,
    lastActiveDate: new Date().toISOString().split('T')[0]
  };
};

export const recordWellnessCompletion = (
  exerciseId: ExerciseId,
  minutes = 3
): WellnessProgressData => {
  const current = getWellnessProgress();
  const today = new Date().toISOString().split('T')[0];

  let streak = current.streakDays;
  if (current.lastActiveDate !== today) {
    const lastDate = new Date(current.lastActiveDate);
    const currDate = new Date(today);
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  const updated: WellnessProgressData = {
    exercisesCompleted: current.exercisesCompleted + 1,
    minutesMindful: current.minutesMindful + minutes,
    streakDays: Math.max(1, streak),
    lastActiveDate: today
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[WellnessProgress] Storage write note:', e);
  }

  return updated;
};

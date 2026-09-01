export interface BlueprintQuestion {
  prompt: string;
  type: 'boolean' | 'number' | 'scale_1_to_5' | 'text';
  habit_type: 'good' | 'bad' | 'neutral';
  icon: string;
}

export interface RoutineBlueprint {
  id: string;
  title: string;
  badge: string;
  description: string;
  icon: string;
  category: string;
  questions: BlueprintQuestion[];
}

export const ROUTINE_BLUEPRINTS: RoutineBlueprint[] = [
  {
    id: 'huberman-protocol',
    title: 'Huberman Morning Protocol',
    badge: 'Popular 🔥',
    description: 'Optimize dopamine, circadian rhythm, and sustained energy throughout the day.',
    icon: 'flame',
    category: 'Biohacking & Focus',
    questions: [
      { prompt: 'Did you view 10-15m morning sunlight?', type: 'boolean', habit_type: 'good', icon: 'sparkles' },
      { prompt: 'Cold shower or cold plunge completed?', type: 'boolean', habit_type: 'good', icon: 'glass-water' },
      { prompt: 'Drank 16-32 oz water with electrolytes?', type: 'boolean', habit_type: 'good', icon: 'glass-water' },
      { prompt: 'Delayed caffeine for 90-120 minutes after waking?', type: 'boolean', habit_type: 'good', icon: 'coffee' },
      { prompt: 'Did you engage in 30+ minutes of Zone 2 cardio or exercise?', type: 'boolean', habit_type: 'good', icon: 'dumbbell' },
    ],
  },
  {
    id: '75-hard',
    title: '75 Hard Discipline Protocol',
    badge: 'Mental Toughness 🛡️',
    description: 'The viral discipline and fitness challenge to build unshakeable mental fortitude.',
    icon: 'dumbbell',
    category: 'Fitness & Toughness',
    questions: [
      { prompt: 'Workout 1 completed (45 mins)?', type: 'boolean', habit_type: 'good', icon: 'dumbbell' },
      { prompt: 'Workout 2 completed outdoors (45 mins)?', type: 'boolean', habit_type: 'good', icon: 'flame' },
      { prompt: 'Drank 1 full gallon (3.7L) of water?', type: 'boolean', habit_type: 'good', icon: 'glass-water' },
      { prompt: 'Followed clean nutrition plan (zero alcohol or cheat meals)?', type: 'boolean', habit_type: 'good', icon: 'heart' },
      { prompt: 'Read 10 pages of non-fiction book?', type: 'boolean', habit_type: 'good', icon: 'book-open' },
      { prompt: 'Took daily progress tracking photo?', type: 'boolean', habit_type: 'good', icon: 'clipboard-list' },
    ],
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits Core System',
    badge: 'High Impact ⚡',
    description: 'James Clear’s compound growth system: small daily 1% wins that accumulate monumental outcomes.',
    icon: 'sparkles',
    category: 'Productivity & Growth',
    questions: [
      { prompt: 'Executed 2-minute rule starter habit?', type: 'boolean', habit_type: 'good', icon: 'check-square' },
      { prompt: 'Completed an intentional habit stack formula?', type: 'boolean', habit_type: 'good', icon: 'brain' },
      { prompt: 'Pages of reading read today', type: 'number', habit_type: 'good', icon: 'book-open' },
      { prompt: 'Avoided mindless social media scrolling before noon?', type: 'boolean', habit_type: 'bad', icon: 'flame' },
      { prompt: 'What 1% improvement did you make today?', type: 'text', habit_type: 'neutral', icon: 'sparkles' },
    ],
  },
  {
    id: 'mental-clarity',
    title: 'Mind & Mental Clarity OS',
    badge: 'Calm & Mindful 🧘',
    description: 'Combat digital burnout, reduce anxiety, and cultivate gratitude and deep sleep.',
    icon: 'brain',
    category: 'Mindfulness & Health',
    questions: [
      { prompt: '10+ minutes of mindfulness, meditation, or breathwork?', type: 'boolean', habit_type: 'good', icon: 'brain' },
      { prompt: 'Hours of restorative sleep', type: 'number', habit_type: 'neutral', icon: 'bed' },
      { prompt: 'Overall mental mood & energy', type: 'scale_1_to_5', habit_type: 'neutral', icon: 'smile' },
      { prompt: 'Turned off digital screens 1 hour before bed?', type: 'boolean', habit_type: 'good', icon: 'bed' },
      { prompt: '3 things I am deeply grateful for today', type: 'text', habit_type: 'neutral', icon: 'heart' },
    ],
  },
];

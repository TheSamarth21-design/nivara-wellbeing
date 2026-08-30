export const RED_PATTERNS = [
  /\b(suicid|kill myself|end my life|want to die|take my own life|hang myself|slit my wrist|jump off)\b/i,
  /\b(no reason to live|better off dead|can't go on anymore|self.?harm|hurt myself)\b/i,
  /\b(mar jana|khudkushi|jaan dena|jeena nahi chahta|jeena nahi chahti|atmahatya)\b/i
];

export const YELLOW_PATTERNS = [
  /\b(hopeless|giving up|worthless|can't take this anymore|exhausted of everything)\b/i,
  /\b(panic attack|cant breathe|crying all day|nobody cares|so isolated|unbearable stress)\b/i,
  /\b(bahut pareshan|dum ghut raha|koi samajhta nahi|himmat toot gayi)\b/i
];

export function checkDeterministicRisk(message: string): 'RED' | 'YELLOW' | 'GREEN' {
  for (const pattern of RED_PATTERNS) {
    if (pattern.test(message)) {
      return 'RED';
    }
  }
  for (const pattern of YELLOW_PATTERNS) {
    if (pattern.test(message)) {
      return 'YELLOW';
    }
  }
  return 'GREEN';
}

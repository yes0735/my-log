export interface LevelInfo {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface BadgeInfo {
  id: number;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string;
}

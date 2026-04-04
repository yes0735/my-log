import { useQuery } from '@tanstack/react-query';
import { gamificationApi } from '@/features/gamification/api';

interface LevelBadgeProps {
  userId?: number;
}

export default function LevelBadge({ userId: _userId }: LevelBadgeProps) {
  const { data: level, isLoading } = useQuery({
    queryKey: ['myLevel'],
    queryFn: () => gamificationApi.getLevel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!level) return null;

  return (
    <div className="flex items-center gap-4">
      {/* Level circle badge */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <div className="text-center leading-tight">
          <span className="text-[10px] font-medium">Lv.</span>
          <span className="block text-lg font-bold leading-none">{level.level}</span>
        </div>
      </div>

      {/* XP info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">
            {level.currentLevelXp} / {level.nextLevelXp} XP
          </span>
          <span className="text-xs text-muted">{level.progressPercent}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${level.progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted">총 XP: {level.totalXp}</p>
      </div>
    </div>
  );
}

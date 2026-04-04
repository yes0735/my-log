import type { BadgeInfo } from '@/types/gamification';

const BADGE_EMOJI: Record<string, string> = {
  FIRST_COMPLETE: '\uD83D\uDCD6',
  BOOKWORM_10: '\uD83D\uDCDA',
  BOOKWORM_50: '\uD83D\uDC51',
  STREAK_7: '\uD83D\uDD25',
  STREAK_30: '\uD83D\uDCAA',
  REVIEWER: '\u270D\uFE0F',
  SOCIAL: '\uD83D\uDC65',
  CHALLENGER: '\uD83C\uDFC6',
};

function getBadgeEmoji(code: string): string {
  return BADGE_EMOJI[code] ?? '\uD83C\uDFC5';
}

interface BadgeListProps {
  badges: BadgeInfo[];
}

export default function BadgeList({ badges }: BadgeListProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={
            badge.earned
              ? 'rounded-lg border border-border bg-card p-3 transition-colors'
              : 'rounded-lg border border-border bg-card p-3 opacity-50 grayscale'
          }
        >
          <div className="text-center">
            <span className="text-3xl">{getBadgeEmoji(badge.code)}</span>
            <p className="mt-1.5 text-sm font-medium">{badge.name}</p>
            {badge.earned ? (
              <>
                <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
                {badge.earnedAt && (
                  <p className="mt-1 text-[10px] text-muted">
                    {new Date(badge.earnedAt).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-0.5 text-xs text-muted">미달성</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

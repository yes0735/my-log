import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { IoPodiumOutline } from 'react-icons/io5';
import { challengeApi } from '@/features/challenge/api';
import type { LeaderboardEntry } from '@/features/challenge/api';
import { useAuthStore } from '@/stores/authStore';

const rankColors: Record<number, string> = {
  1: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  2: 'bg-gray-100 border-gray-400 text-gray-700',
  3: 'bg-orange-100 border-orange-400 text-orange-800',
};

const rankEmoji: Record<number, string> = {
  1: '\uD83E\uDD47',
  2: '\uD83E\uDD48',
  3: '\uD83E\uDD49',
};

export default function Leaderboard() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const currentUser = useAuthStore((s) => s.user);

  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', period],
    queryFn: () => challengeApi.getLeaderboard(period),
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <IoPodiumOutline className="text-2xl text-primary" />
        <h1 className="text-2xl font-bold">리더보드</h1>
      </div>

      {/* Period Tabs */}
      <div className="mb-6 flex border-b border-border">
        <button
          onClick={() => setPeriod('week')}
          className={`px-4 py-2 text-sm font-medium ${
            period === 'week'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          주간
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 text-sm font-medium ${
            period === 'month'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          월간
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted">로딩 중...</p>
      ) : entries?.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <IoPodiumOutline className="text-5xl" />
          <p className="mt-4 text-lg">아직 리더보드 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">사용자</th>
                <th className="px-3 py-2 text-right font-medium">완독 수</th>
                <th className="px-3 py-2 text-right font-medium">읽은 페이지</th>
              </tr>
            </thead>
            <tbody>
              {entries?.map((entry) => {
                const isCurrentUser = currentUser?.id === entry.userId;
                const isTopThree = entry.rank <= 3;
                return (
                  <tr
                    key={entry.userId}
                    className={`border-b border-border transition-colors ${
                      isCurrentUser
                        ? 'bg-primary/5 font-medium'
                        : isTopThree
                        ? rankColors[entry.rank] || ''
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <td className="px-3 py-3 font-semibold">
                      {isTopThree ? (
                        <span className="text-base">{rankEmoji[entry.rank]}</span>
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to={`/profile/${entry.userId}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        {entry.profileImageUrl ? (
                          <img
                            src={entry.profileImageUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                            {entry.nickname[0]}
                          </div>
                        )}
                        <span>{entry.nickname}</span>
                        {isCurrentUser && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                            나
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right">{entry.completedBooks}권</td>
                    <td className="px-3 py-3 text-right">{entry.pagesRead.toLocaleString()}p</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

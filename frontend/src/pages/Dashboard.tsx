import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { statsApi, goalApi } from '@/features/stats/api';
import { bookApi } from '@/features/books/api';
import { gamificationApi } from '@/features/gamification/api';
import LevelBadge from '@/features/gamification/LevelBadge';
import AdBanner from '@/components/ads/AdBanner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// Design Ref: §5.4 — Dashboard page UI
export default function Dashboard() {
  const currentYear = new Date().getFullYear();

  const { data: summary } = useQuery({
    queryKey: ['statsSummary'],
    queryFn: () => statsApi.getSummary(),
  });

  const { data: monthly } = useQuery({
    queryKey: ['monthlyStats', currentYear],
    queryFn: () => statsApi.getMonthly(currentYear),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals', currentYear],
    queryFn: () => goalApi.getGoals(currentYear),
  });

  const { data: readingBooks } = useQuery({
    queryKey: ['myBooks', 'READING', 0],
    queryFn: () => bookApi.getMyBooks({ status: 'READING', page: 0, size: 3 }),
  });

  const { data: myBadges } = useQuery({
    queryKey: ['myBadges'],
    queryFn: () => gamificationApi.getMyBadges(),
  });

  const weeklyData = monthly?.slice(-4).map((m) => ({
    name: monthNames[m.month - 1],
    pages: m.pagesRead,
  })) ?? [];

  const yearGoal = goals?.find((g) => !g.targetMonth);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">대시보드</h1>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: '완독 권수', value: summary?.completedBooks ?? 0, icon: '✅', color: 'text-green-600' },
          { label: '읽는 중', value: summary?.readingBooks ?? 0, icon: '📖', color: 'text-yellow-600' },
          { label: '총 페이지', value: (summary?.totalPagesRead ?? 0).toLocaleString(), icon: '📄', color: 'text-blue-600' },
          { label: '평균 별점', value: summary?.averageRating ?? '-', icon: '⭐', color: 'text-yellow-500' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <span className="text-2xl">{icon}</span>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Level & Recent Badges */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {/* Level widget */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">내 레벨</h2>
          <LevelBadge />
        </div>

        {/* Recent badges */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">최근 배지</h2>
          {(() => {
            const earned = myBadges?.filter((b) => b.earned) ?? [];
            const recent = earned.slice(-3).reverse();
            if (recent.length === 0) {
              return <p className="py-2 text-sm text-muted">아직 획득한 배지가 없습니다.</p>;
            }
            const BADGE_EMOJI: Record<string, string> = {
              FIRST_COMPLETE: '\uD83D\uDCD6', BOOKWORM_10: '\uD83D\uDCDA', BOOKWORM_50: '\uD83D\uDC51',
              STREAK_7: '\uD83D\uDD25', STREAK_30: '\uD83D\uDCAA', REVIEWER: '\u270D\uFE0F',
              SOCIAL: '\uD83D\uDC65', CHALLENGER: '\uD83C\uDFC6',
            };
            return (
              <div className="flex gap-3">
                {recent.map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 flex-1">
                    <span className="text-2xl">{BADGE_EMOJI[badge.code] ?? '\uD83C\uDFC5'}</span>
                    <span className="text-xs font-medium text-center">{badge.name}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Goal progress */}
        {yearGoal && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{currentYear}년 독서 목표</h2>
              <Link to="/goals" className="text-xs text-primary hover:underline">자세히</Link>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#6366f1" strokeWidth="3"
                    strokeDasharray={`${yearGoal.progressPercent}, 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {yearGoal.progressPercent}%
                </span>
              </div>
              <div>
                <p className="text-lg font-bold">{yearGoal.completedBooks} / {yearGoal.targetBooks}권</p>
                <p className="text-sm text-muted">달성률</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">최근 독서량</h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pages" name="페이지" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Currently reading */}
      {readingBooks?.content && readingBooks.content.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">현재 읽는 중</h2>
            <Link to="/books?status=READING" className="text-xs text-primary hover:underline">전체 보기</Link>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {readingBooks.content.map((ub) => {
              const progress = ub.book.totalPages && ub.currentPage
                ? Math.round((ub.currentPage / ub.book.totalPages) * 100) : 0;
              return (
                <Link key={ub.id} to={`/books/${ub.id}`}
                  className="flex gap-3 rounded-lg border border-border p-3 hover:shadow-sm">
                  <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-secondary/50">
                    {ub.book.coverImageUrl
                      ? <img src={ub.book.coverImageUrl} alt="" className="h-full object-contain rounded" />
                      : <span>📖</span>}
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{ub.book.title}</p>
                    <p className="text-xs text-muted">{ub.book.author}</p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{progress}%</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">최근 활동</h2>
        {readingBooks?.content && readingBooks.content.length > 0 ? (
          <div>
            <p className="mb-3 text-sm text-muted">
              현재 <span className="font-medium text-foreground">{readingBooks.content.length}권</span> 읽는 중
            </p>
            <div className="space-y-2">
              {readingBooks.content.map((ub) => {
                const progress = ub.book.totalPages && ub.currentPage
                  ? Math.round((ub.currentPage / ub.book.totalPages) * 100) : 0;
                return (
                  <Link key={ub.id} to={`/books/${ub.id}`}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-secondary/50">
                    <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-secondary/50">
                      {ub.book.coverImageUrl
                        ? <img src={ub.book.coverImageUrl} alt="" className="h-full object-contain rounded" />
                        : <span className="text-xs">📖</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-sm font-medium">{ub.book.title}</p>
                      <p className="text-xs text-muted">
                        {ub.currentPage ? `${ub.currentPage}p` : '0p'}
                        {ub.book.totalPages ? ` / ${ub.book.totalPages}p (${progress}%)` : ''}
                        {ub.startDate ? ` · ${ub.startDate} 시작` : ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted">
            현재 읽고 있는 책이 없습니다. 서재에서 책을 추가해보세요.
          </p>
        )}
      </div>

      {/* AdSense — Design Ref: §9.8 */}
      <AdBanner
        adClient="ca-pub-XXXXXXXX"
        adSlot="DASHBOARD_SLOT_ID"
        className="mt-6"
      />
    </div>
  );
}

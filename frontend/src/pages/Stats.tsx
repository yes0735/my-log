import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/features/stats/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function Stats() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: summary } = useQuery({
    queryKey: ['statsSummary'],
    queryFn: () => statsApi.getSummary(),
  });

  const { data: monthly } = useQuery({
    queryKey: ['monthlyStats', year],
    queryFn: () => statsApi.getMonthly(year),
  });

  const { data: genres } = useQuery({
    queryKey: ['genreStats'],
    queryFn: () => statsApi.getGenres(),
  });

  const { data: yearly } = useQuery({
    queryKey: ['yearlyStats', year],
    queryFn: () => statsApi.getYearly(year),
  });

  const chartData = monthly?.map((m) => ({
    name: monthNames[m.month - 1],
    pages: m.pagesRead,
    records: m.recordCount,
  })) ?? [];

  const genreData = genres?.map((g) => ({
    name: g.name,
    value: g.count,
  })) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">독서 통계</h1>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm">
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: '전체 책', value: summary?.totalBooks ?? 0, icon: '📚' },
          { label: '완독', value: summary?.completedBooks ?? 0, icon: '✅' },
          { label: '읽는 중', value: summary?.readingBooks ?? 0, icon: '📖' },
          { label: '총 페이지', value: (summary?.totalPagesRead ?? 0).toLocaleString(), icon: '📄' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Yearly summary card */}
      {yearly && (
        <div className="mb-8 rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 font-semibold">{year}년 연간 요약</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">{yearly.totalBooks}</p>
              <p className="text-xs text-muted">등록한 책</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{yearly.completedBooks}</p>
              <p className="text-xs text-muted">완독한 책</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{yearly.totalPagesRead.toLocaleString()}</p>
              <p className="text-xs text-muted">읽은 페이지</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{yearly.averageRating > 0 ? yearly.averageRating : '-'}</p>
              <p className="text-xs text-muted">평균 별점</p>
            </div>
          </div>
        </div>
      )}

      {/* Genre PieChart + Monthly BarChart row */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {/* Genre distribution pie chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 font-semibold">장르 분포</h2>
          <div className="h-72">
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {genreData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                카테고리가 설정된 책이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* Monthly chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 font-semibold">월별 독서량 ({year}년)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="pages" name="읽은 페이지" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Average rating */}
      {summary && summary.averageRating > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">평균 별점</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-yellow-400">{'★'.repeat(Math.round(summary.averageRating))}</span>
            <span className="text-lg text-muted">{summary.averageRating} / 5.0</span>
          </div>
        </div>
      )}
    </div>
  );
}

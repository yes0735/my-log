import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HiBookOpen, HiUserGroup } from 'react-icons/hi2';
import { feedApi, type FeedItem } from '@/features/feed/api';
import { reviewApi, type Review } from '@/features/reviews/api';

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}일 전`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}개월 전`;
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function FeedItemCard({ item }: { item: FeedItem }) {
  const description =
    item.type === 'COMPLETED'
      ? `${item.nickname}님이 '${item.bookTitle}'을(를) 완독했습니다`
      : item.type === 'REVIEW'
        ? `${item.nickname}님이 '${item.bookTitle}' 독후감을 작성했습니다: ${item.content}`
        : `${item.nickname}님이 '${item.bookTitle}'에 기록을 남겼습니다`;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${item.userId}`} className="shrink-0">
          {item.profileImageUrl ? (
            <img
              src={item.profileImageUrl}
              alt={item.nickname}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(item.nickname)}`}
            >
              {item.nickname.charAt(0)}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${item.userId}`}
              className="text-sm font-semibold hover:underline"
            >
              {item.nickname}
            </Link>
            <span className="text-xs text-muted">{formatRelativeTime(item.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-foreground">{description}</p>
        </div>
        {item.bookCoverUrl ? (
          <Link to={`/books/${item.bookId}`} className="shrink-0">
            <img
              src={item.bookCoverUrl}
              alt={item.bookTitle}
              className="h-16 w-12 rounded object-cover"
            />
          </Link>
        ) : (
          <Link
            to={`/books/${item.bookId}`}
            className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-secondary text-muted"
          >
            <HiBookOpen className="text-lg" />
          </Link>
        )}
      </div>
    </div>
  );
}

function PublicReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{review.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm text-muted">{review.content}</p>
          <span className="mt-2 inline-block text-xs text-muted">
            {formatRelativeTime(review.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

type Tab = 'timeline' | 'public';

export default function Feed() {
  const [tab, setTab] = useState<Tab>('timeline');
  const [feedPage, setFeedPage] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [publicReviews, setPublicReviews] = useState<Review[]>([]);

  const feedQuery = useQuery({
    queryKey: ['feed', feedPage],
    queryFn: async () => {
      const data = await feedApi.getFeed(feedPage);
      return data;
    },
    enabled: tab === 'timeline',
  });

  const publicQuery = useQuery({
    queryKey: ['publicReviews', reviewPage],
    queryFn: async () => {
      const data = await reviewApi.getPublicReviews(reviewPage);
      return data;
    },
    enabled: tab === 'public',
  });

  const handleLoadMoreFeed = useCallback(() => {
    if (feedQuery.data) {
      setFeedItems((prev) => [...prev, ...feedQuery.data]);
    }
    setFeedPage((p) => p + 1);
  }, [feedQuery.data]);

  const handleLoadMoreReviews = useCallback(() => {
    if (publicQuery.data) {
      setPublicReviews((prev) => [...prev, ...publicQuery.data.content]);
    }
    setReviewPage((p) => p + 1);
  }, [publicQuery.data]);

  // Combine accumulated items with current query data
  const allFeedItems =
    feedPage === 0 && feedQuery.data
      ? feedQuery.data
      : feedItems.concat(feedQuery.data ?? []);

  const allPublicReviews =
    reviewPage === 0 && publicQuery.data
      ? publicQuery.data.content
      : publicReviews.concat(publicQuery.data?.content ?? []);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-primary text-primary'
        : 'border-transparent text-muted hover:text-foreground'
    }`;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">피드</h1>

      <div className="mb-6 flex border-b border-border">
        <button className={tabClass('timeline')} onClick={() => setTab('timeline')}>
          타임라인
        </button>
        <button className={tabClass('public')} onClick={() => setTab('public')}>
          공개 독후감
        </button>
      </div>

      {tab === 'timeline' && (
        <>
          {feedQuery.isLoading && feedPage === 0 ? (
            <p className="text-muted">로딩 중...</p>
          ) : allFeedItems.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted">
              <HiUserGroup className="text-5xl" />
              <p className="mt-4 text-lg">
                팔로우한 사용자가 없거나 아직 활동이 없습니다
              </p>
              <Link to="/community" className="mt-2 text-primary hover:underline">
                커뮤니티 둘러보기
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {allFeedItems.map((item, idx) => (
                <FeedItemCard key={`${item.type}-${item.userId}-${item.createdAt}-${idx}`} item={item} />
              ))}
              {feedQuery.data && feedQuery.data.length >= 20 && (
                <div className="text-center">
                  <button
                    onClick={handleLoadMoreFeed}
                    disabled={feedQuery.isFetching}
                    className="rounded border border-border px-6 py-2 text-sm text-muted hover:bg-secondary"
                  >
                    {feedQuery.isFetching ? '로딩 중...' : '더 보기'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'public' && (
        <>
          {publicQuery.isLoading && reviewPage === 0 ? (
            <p className="text-muted">로딩 중...</p>
          ) : allPublicReviews.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted">
              <HiBookOpen className="text-5xl" />
              <p className="mt-4 text-lg">아직 공개된 독후감이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPublicReviews.map((review, idx) => (
                <PublicReviewCard key={`${review.id}-${idx}`} review={review} />
              ))}
              {publicQuery.data &&
                publicQuery.data.content.length >= 20 && (
                  <div className="text-center">
                    <button
                      onClick={handleLoadMoreReviews}
                      disabled={publicQuery.isFetching}
                      className="rounded border border-border px-6 py-2 text-sm text-muted hover:bg-secondary"
                    >
                      {publicQuery.isFetching ? '로딩 중...' : '더 보기'}
                    </button>
                  </div>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

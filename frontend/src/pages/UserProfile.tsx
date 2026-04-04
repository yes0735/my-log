import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { followApi } from '@/features/follow/api';
import { gamificationApi } from '@/features/gamification/api';
import BadgeList from '@/features/gamification/BadgeList';
import FollowButton from '@/features/follow/FollowButton';
import { useAuthStore } from '@/stores/authStore';
import { IoBookOutline, IoCheckmarkDoneOutline, IoPeopleOutline, IoPersonOutline } from 'react-icons/io5';

type Tab = 'recent' | 'followers' | 'following';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('recent');
  const isOwnProfile = currentUser?.id === userId;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => followApi.getProfile(userId),
    enabled: !!userId,
  });

  const { data: levelInfo } = useQuery({
    queryKey: ['myLevel'],
    queryFn: () => gamificationApi.getLevel(),
    enabled: isOwnProfile,
  });

  const { data: myBadges } = useQuery({
    queryKey: ['myBadges'],
    queryFn: () => gamificationApi.getMyBadges(),
    enabled: isOwnProfile,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center text-muted">
        프로필을 불러올 수 없습니다.
      </div>
    );
  }

  const stats = [
    { label: '전체 도서', value: profile.stats.totalBooks, icon: IoBookOutline },
    { label: '완독', value: profile.stats.completedBooks, icon: IoCheckmarkDoneOutline },
    { label: '팔로워', value: profile.stats.followerCount, icon: IoPeopleOutline },
    { label: '팔로잉', value: profile.stats.followingCount, icon: IoPersonOutline },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'recent', label: '최근 활동' },
    { key: 'followers', label: '팔로워' },
    { key: 'following', label: '팔로잉' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-start">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-secondary">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.nickname}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted">
              {profile.nickname.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold">{profile.nickname}</h1>
            {isOwnProfile && levelInfo && (
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                Lv.{levelInfo.level}
              </span>
            )}
          </div>
          {!isOwnProfile && (
            <div className="mt-3">
              <FollowButton userId={userId} isFollowing={profile.isFollowing} />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-4"
            >
              <Icon className="h-5 w-5 text-muted" />
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Earned Badges */}
      {isOwnProfile && myBadges && myBadges.filter((b) => b.earned).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">획득한 배지</h2>
          <BadgeList badges={myBadges.filter((b) => b.earned)} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? 'border-b-2 border-primary pb-2 text-sm font-medium text-primary'
                  : 'pb-2 text-sm text-muted hover:text-foreground'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'recent' && (
        <RecentBooksPanel books={profile.recentBooks} />
      )}
      {activeTab === 'followers' && (
        <FollowListPanel userId={userId} type="followers" />
      )}
      {activeTab === 'following' && (
        <FollowListPanel userId={userId} type="following" />
      )}
    </div>
  );
}

function RecentBooksPanel({ books }: { books: Array<{ id: number; title: string; coverImageUrl?: string }> }) {
  if (books.length === 0) {
    return <p className="py-8 text-center text-muted">최근 활동이 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {books.map((book) => (
        <Link
          key={book.id}
          to={`/books/${book.id}`}
          className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary"
        >
          <div className="aspect-[3/4] w-full overflow-hidden rounded bg-secondary">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                No Cover
              </div>
            )}
          </div>
          <p className="mt-2 truncate text-sm font-medium">{book.title}</p>
        </Link>
      ))}
    </div>
  );
}

function FollowListPanel({ userId, type }: { userId: number; type: 'followers' | 'following' }) {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: [type, userId, page],
    queryFn: () =>
      type === 'followers'
        ? followApi.getFollowers(userId, page)
        : followApi.getFollowing(userId, page),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <p className="py-8 text-center text-muted">
        {type === 'followers' ? '팔로워가 없습니다.' : '팔로잉하는 사용자가 없습니다.'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.content.map((user) => (
        <Link
          key={user.userId}
          to={`/profile/${user.userId}`}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted">
                {user.nickname.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{user.nickname}</p>
            <p className="text-xs text-muted">
              {new Date(user.followedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </Link>
      ))}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-muted">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.totalPages - 1}
            className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followApi } from './api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
}

export default function FollowButton({ userId, isFollowing: initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => followApi.follow(userId),
    onSuccess: () => {
      setFollowing(true);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('팔로우했습니다');
    },
    onError: () => {
      toast.error('팔로우에 실패했습니다');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followApi.unfollow(userId),
    onSuccess: () => {
      setFollowing(false);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('팔로우를 취소했습니다');
    },
    onError: () => {
      toast.error('팔로우 취소에 실패했습니다');
    },
  });

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        following
          ? 'border border-border bg-card text-foreground hover:bg-secondary hover:text-red-500'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      )}
    >
      {isLoading ? '...' : following ? '팔로잉' : '팔로우'}
    </button>
  );
}

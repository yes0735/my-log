import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoTrophyOutline } from 'react-icons/io5';
import { challengeApi } from '@/features/challenge/api';
import type { Challenge, Participant } from '@/features/challenge/api';
import toast from 'react-hot-toast';

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const challengeId = Number(id);

  const { data: challenge, isLoading: challengeLoading } = useQuery<Challenge>({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeApi.getChallenge(challengeId),
    enabled: !!challengeId,
  });

  const { data: participants, isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: ['challenge-participants', challengeId],
    queryFn: () => challengeApi.getParticipants(challengeId),
    enabled: !!challengeId,
  });

  const joinMutation = useMutation({
    mutationFn: () => challengeApi.joinChallenge(challengeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenge', challengeId] });
      qc.invalidateQueries({ queryKey: ['challenge-participants', challengeId] });
      toast.success('챌린지에 참가했습니다');
    },
    onError: () => toast.error('참가에 실패했습니다'),
  });

  if (challengeLoading) return <p className="text-muted">로딩 중...</p>;
  if (!challenge) return <p className="text-muted">챌린지를 찾을 수 없습니다.</p>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/challenges')}
          className="mb-3 text-sm text-muted hover:text-foreground"
        >
          &larr; 챌린지 목록
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <IoTrophyOutline className="text-2xl text-primary" />
              <h1 className="text-2xl font-bold">{challenge.title}</h1>
            </div>
            {challenge.description && (
              <p className="mt-2 text-sm text-muted">{challenge.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span>목표: <strong className="text-foreground">{challenge.targetBooks}권</strong></span>
              <span>{challenge.startDate} ~ {challenge.endDate}</span>
              <span>{challenge.participantCount}명 참가 중</span>
              <span>by {challenge.creatorNickname}</span>
            </div>
          </div>
          <div>
            {challenge.isJoined ? (
              <span className="rounded bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                참가 중
              </span>
            ) : (
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                참가
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">참가자 ({participants?.length ?? 0}명)</h2>
        {participantsLoading ? (
          <p className="text-muted">로딩 중...</p>
        ) : participants?.length === 0 ? (
          <p className="py-8 text-center text-muted">아직 참가자가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {participants?.map((p) => (
              <Link
                key={p.userId}
                to={`/profile/${p.userId}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md"
              >
                {p.profileImageUrl ? (
                  <img
                    src={p.profileImageUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {p.nickname[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.nickname}</span>
                    <span className="text-sm text-muted">
                      {p.completedBooks} / {challenge.targetBooks}권
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (p.completedBooks / challenge.targetBooks) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(p.joinedAt).toLocaleDateString()} 참가
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

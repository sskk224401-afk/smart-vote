import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/firebase';
import {
  CheckCircle2,
  Loader2,
  Lock,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import Background from '@/components/Background';

type PollData = {
  candidate1Name: string;
  candidate1Image: string;
  candidate2Name: string;
  candidate2Image: string;
  votes1: number;
  votes2: number;
};

type Props = {
  pollCode: string;
  onBackHome: () => void;
};

export default function VotingView({ pollCode }: Props) {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [votingFor, setVotingFor] = useState<1 | 2 | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'polls', pollCode), (snap) => {
      if (!snap.exists()) {
        setError('لم يعد الاستطلاع متاحاً.');
        setLoading(false);
        return;
      }
      const d = snap.data() as Partial<PollData>;
      setPoll({
        candidate1Name: d.candidate1Name ?? 'المرشّح الأول',
        candidate1Image: d.candidate1Image ?? '',
        candidate2Name: d.candidate2Name ?? 'المرشّح الثاني',
        candidate2Image: d.candidate2Image ?? '',
        votes1: d.votes1 ?? 0,
        votes2: d.votes2 ?? 0,
      });
      setLoading(false);
    });
    return () => unsub();
  }, [pollCode]);

  useEffect(() => {
    const checkUserVote = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'voted_polls', pollCode));
        if (snap.exists()) setVoted(true);
      } catch (e) {
        console.error(e);
      }
    };
    checkUserVote();
  }, [pollCode]);

  const handleVote = async (which: 1 | 2) => {
    if (voted) return;
    setVotingFor(which);
    setError(null);
    try {
      let user = auth.currentUser;
      if (!user) {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      }

      const voteRef = doc(db, 'users', user.uid, 'voted_polls', pollCode);
      const alreadyVoted = (await getDoc(voteRef)).exists();
      if (alreadyVoted) {
        setVoted(true);
        setVotingFor(null);
        return;
      }

      await runTransaction(db, async (tx) => {
        const pollRef = doc(db, 'polls', pollCode);
        const pollSnap = await tx.get(pollRef);
        if (!pollSnap.exists()) throw new Error('not-found');
        const data = pollSnap.data() as PollData;
        const field = which === 1 ? 'votes1' : 'votes2';
        tx.update(pollRef, { [field]: (data[field] ?? 0) + 1 });
        tx.set(voteRef, { candidate: which, votedAt: Date.now() });
      });

      setVoted(true);
    } catch (err: any) {
      console.error("تفاصيل خطأ التصويت:", err);
      setError(`خطأ: ${err.message || 'تعذّر تسجيل صوتك'}`);
    }
  };

  if (loading || !poll) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <Background />
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const total = poll.votes1 + poll.votes2;
  const pct1 = total > 0 ? Math.round((poll.votes1 / total) * 100) : 0;
  const pct2 = total > 0 ? 100 - pct1 : 0;
  const leader = poll.votes1 === poll.votes2 ? null : poll.votes1 > poll.votes2 ? 1 : 2;

  return (
    <div className="relative min-h-screen">
      <Background />

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <div className="flex items-center justify-end animate-fade-up">
          <div className="flex items-center gap-2 rounded-full border border-white/10 glass-light px-3 py-1.5">
            <span className="text-xs text-gray-500">رمز الاستطلاع:</span>
            <span className="font-mono text-sm font-bold text-emerald-400">{pollCode}</span>
          </div>
        </div>

        <div className="mt-6 text-center animate-fade-up">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">التصويت المباشر</h1>
          <p className="mt-1.5 text-sm text-gray-500">اختر مرشّحك</p>
        </div>

        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {voted && (
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300 animate-scale-in">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            تم تسجيل صوتك بنجاح، شكراً لمشاركتك
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <CandidateCard
            name={poll.candidate1Name}
            image={poll.candidate1Image}
            isLeader={leader === 1}
            isVoting={votingFor === 1}
            disabled={voted}
            onVote={() => handleVote(1)}
            color="emerald"
          />
          <CandidateCard
            name={poll.candidate2Name}
            image={poll.candidate2Image}
            isLeader={leader === 2}
            isVoting={votingFor === 2}
            disabled={voted}
            onVote={() => handleVote(2)}
            color="blue"
          />
        </div>

        <div className="mt-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">النتائج المباشرة</h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="h-4 w-4" />
              {total.toLocaleString('ar-EG')} صوت
            </div>
          </div>

          <div className="space-y-5">
            <ResultBar
              name={poll.candidate1Name}
              votes={poll.votes1}
              pct={pct1}
              color="emerald"
              isLeader={leader === 1}
            />
            <ResultBar
              name={poll.candidate2Name}
              votes={poll.votes2}
              pct={pct2}
              color="blue"
              isLeader={leader === 2}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
          <Lock className="h-3.5 w-3.5" />
          النتائج تتحدّث لحظياً. صوت واحد لكل مستخدم.
        </div>
      </div>
    </div>
  );
}

function CandidateCard({
  name,
  image,
  isLeader,
  isVoting,
  disabled,
  onVote,
  color,
}: {
  name: string;
  image: string;
  isLeader: boolean;
  isVoting: boolean;
  disabled: boolean;
  onVote: () => void;
  color: 'emerald' | 'blue';
}) {
  const styles =
    color === 'emerald'
      ? {
          ring: isLeader ? 'border-emerald-400/50 shadow-neon-green' : 'border-white/10',
          btn: 'from-emerald-400 to-emerald-600 shadow-neon-green hover:shadow-neon-green-lg',
        }
      : {
          ring: isLeader ? 'border-blue-400/50 shadow-neon-blue' : 'border-white/10',
          btn: 'from-blue-400 to-blue-600 shadow-neon-blue hover:shadow-neon-blue-lg',
        };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-ink-900/60 transition-all animate-scale-in ${styles.ring}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
            <User className="h-16 w-16 text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
        {isLeader && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#0a0a0a]/80 px-2.5 py-1 text-xs font-bold text-emerald-400 backdrop-blur">
            <Trophy className="h-3.5 w-3.5" />
            الصدارة
          </div>
        )}
        <h3 className="absolute bottom-3 right-4 text-xl font-bold text-white drop-shadow-lg">
          {name}
        </h3>
      </div>

      <div className="p-4">
        <button
          onClick={onVote}
          disabled={disabled || isVoting}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${styles.btn} px-5 py-3.5 text-sm font-bold text-[#0a0a0a] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none`}
        >
          {isVoting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : disabled ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Trophy className="h-5 w-5" />
          )}
          {isVoting ? 'جارٍ التسجيل…' : disabled ? 'تم التصويت' : 'صوّت لهذا المرشّح'}
        </button>
      </div>
    </div>
  );
}

function ResultBar({
  name,
  votes,
  pct,
  color,
  isLeader,
}: {
  name: string;
  votes: number;
  pct: number;
  color: 'emerald' | 'blue';
  isLeader: boolean;
}) {
  const bar =
    color === 'emerald'
      ? 'from-emerald-400 to-emerald-600'
      : 'from-blue-400 to-blue-600';
  const text = color === 'emerald' ? 'text-emerald-400' : 'text-blue-400';

  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className={`font-semibold ${isLeader ? text : 'text-white'}`}>
          {isLeader && <Trophy className="ml-1 inline h-3.5 w-3.5" />}
          {name}
        </span>
        <span className="text-gray-500">
          {votes.toLocaleString('ar-EG')} صوت · {pct}٪
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
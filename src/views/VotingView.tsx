import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
// تم تغيير الاستيراد هنا لاستخدام signInWithRedirect
import { signInWithRedirect, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db, googleProvider } from '@/firebase';
import {
  CheckCircle2,
  Loader2,
  Lock,
  Trophy,
  User,
  Users,
  ShieldCheck,
  LogOut,
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
  const [authChecking, setAuthChecking] = useState(true);
  const [voted, setVoted] = useState(false);
  const [votingFor, setVotingFor] = useState<1 | 2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const enforceFreshLogin = async () => {
      if (!sessionStorage.getItem('voting_session_started')) {
        await signOut(auth);
        sessionStorage.setItem('voting_session_started', 'true');
      }
    };
    enforceFreshLogin();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

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
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid, 'voted_polls', pollCode));
        if (snap.exists()) setVoted(true);
      } catch (e) {
        console.error(e);
      }
    };
    checkUserVote();
  }, [pollCode, currentUser]);

  const handleVote = async (which: 1 | 2) => {
    const user = auth.currentUser;
    if (!user || voted) return;

    setVotingFor(which);
    setError(null);
    try {
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
    } finally {
      setVotingFor(null);
    }
  };

  if (authChecking) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-black">
        <Background />
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-black p-4">
        <Background />
        <div className="w-full max-w-md rounded-3xl bg-black/80 border border-white/10 p-8 text-center shadow-2xl relative animate-scale-in z-10 backdrop-blur-xl">
          
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-bold mb-8 text-white">سجل في الإنتخابات</h2>
          
          <button
            onClick={async () => {
              try {
                googleProvider.setCustomParameters({
                  prompt: 'select_account'
                });
                // استخدام التحويل المباشر لحل كل مشاكل الـ Vercel والموبايل
                await signInWithRedirect(auth, googleProvider);
              } catch (err) {
                console.error("خطأ في تسجيل الدخول:", err);
              }
            }}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white text-black hover:bg-gray-100 py-3.5 px-4 font-bold transition shadow-lg text-sm cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15c1.9 3.8 5.8 8 10.4 8z"/>
            </svg>
            تسجيل الدخول بحساب جوجل
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <Lock className="h-4 w-4" /> محمي بتشفير تام
          </div>
        </div>
      </div>
    );
  }

  if (loading || !poll) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-black">
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
    <div className="relative min-h-screen text-white bg-black overflow-hidden">
      <Background />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 z-10 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-400">التصويت المباشر</div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
              >
                <LogOut className="h-3.5 w-3.5" /> تسجيل خروج
              </button>
            )}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-xl">
              <span className="text-xs text-gray-400">رمز الاستطلاع:</span>
              <span className="font-mono text-sm font-bold text-emerald-400">{pollCode}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">التصويت المباشر</h1>
          <p className="mt-1.5 text-sm text-gray-400">اختر مرشّحك</p>
        </div>

        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {voted && (
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300">
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

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">النتائج المباشرة</h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="h-4 w-4" />
              {total} صوت
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

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
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
          ring: isLeader ? 'border-emerald-400/50' : 'border-white/10',
          btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        }
      : {
          ring: isLeader ? 'border-blue-400/50' : 'border-white/10',
          btn: 'bg-blue-600 hover:bg-blue-500 text-white',
        };

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-xl p-4 flex flex-col justify-between ${styles.ring}`}>
      <div>
        <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-gray-900">
          {image ? (
            <img src={image} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-800">
              <User className="h-12 w-12 text-gray-500" />
            </div>
          )}
        </div>
        {isLeader && (
          <div className="absolute right-6 top-6 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-bold text-emerald-400 backdrop-blur">
            <Trophy className="h-3.5 w-3.5" /> الصدارة
          </div>
        )}
        <h3 className="text-xl font-bold text-center mb-4">{name}</h3>
      </div>
      <button
        onClick={onVote}
        disabled={disabled || isVoting}
        className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${styles.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isVoting ? <Loader2 className="h-5 w-5 animate-spin" /> : disabled ? <CheckCircle2 className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
        {isVoting ? 'جارٍ التسجيل…' : disabled ? 'تم التصويت' : 'صوّت لهذا المرشّح'}
      </button>
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
  const bar = color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
  const text = color === 'emerald' ? 'text-emerald-400' : 'text-blue-400';

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className={`font-semibold ${isLeader ? text : 'text-white'}`}>
          {isLeader && <Trophy className="ml-1 inline h-3.5 w-3.5" />}
          {name}
        </span>
        <span className="text-gray-400">
          {votes} صوت ({pct}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
        <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
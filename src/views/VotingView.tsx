import emailjs from '@emailjs/browser';
import { useEffect, useState } from 'react';
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  runTransaction 
} from 'firebase/firestore';
import { signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '@/firebase';
import { 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Trophy, 
  User, 
  Users, 
  ShieldCheck, 
  Share2 
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
  onBack: () => void;
};

export default function VotingView({ pollCode, onBack }: Props) {
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
        setError('رمز الاستطلاع غير موجود.');
        setLoading(false);
        return;
      }
      const d = snap.data() as PollData;
      setPoll({
        candidate1Name: d.candidate1Name ?? 'المرشح الأول',
        candidate1Image: d.candidate1Image ?? '',
        candidate2Name: d.candidate2Name ?? 'المرشح الثاني',
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

      let reachedMilestone = false;
      let milestoneVotes = 0;
      let milestoneCandidate = '';

      await runTransaction(db, async (tx) => {
        const pollRef = doc(db, 'polls', pollCode);
        const pollSnap = await tx.get(pollRef);
        if (!pollSnap.exists()) throw new Error('not-found');
        
        const data = pollSnap.data() as PollData;
        const field = which === 1 ? 'votes1' : 'votes2';
        const newVotesCount = (data[field] ?? 0) + 1;
        
        tx.update(pollRef, { [field]: newVotesCount });
        tx.set(voteRef, { candidate: which, votedAt: Date.now() });

        if (newVotesCount > 0) {         
           reachedMilestone = true;
          milestoneVotes = newVotesCount;
          milestoneCandidate = which === 1 ? data.candidate1Name : data.candidate2Name;
        }
      });

      setVoted(true);

      if (reachedMilestone) {
        emailjs.send(
          'service_hjcm4oi',
          'template_9t0z123', // استبدل بـ Template ID الحقيقي
          {
            candidate_name: milestoneCandidate,
            vote_count: milestoneVotes,
            poll_code: pollCode
          },
          'YOUR_PUBLIC_KEY'   // استبدل بـ Public Key الحقيقي
        ).then(() => {
          console.log('تم إرسال إشعار الإيميل بنجاح!');
        }).catch((err) => {
          console.error('فشل إرسال الإيميل:', err);
        });
      }
    } catch (err: any) {
      console.error("تفاصيل خطأ التصويت:", err);
      setError(`خطأ أثناء تسجيل صوتك: ${err.message || ''}`);
    } finally {
      setVotingFor(null);
    }
  };

  if (authChecking) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-black">
        <Background />
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-black p-4">
        <Background />
        <div className="w-full max-w-md rounded-3xl bg-black/80 border border-white/10 p-8 text-center shadow-2xl relative animate-scale-in-backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold mb-8 text-white">تسجيل الدخول للمصداقية</h2>
          <button
            onClick={async () => {
              try {
                googleProvider.setCustomParameters({ prompt: 'select_account' });
                await signInWithPopup(auth, googleProvider);
              } catch (err: any) {
                console.error("خطأ في تسجيل الدخول:", err);
                setError(`تعذر حتمًا تسجيل الدخول: ${err.message || ''}`);
              }
            }}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white text-black hover:bg-gray-100 py-3.5 px-4 font-bold transition shadow-lg text-sm cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.27c0-.82-.07-1.64-.21-2.43H12v4.63h6.51c-.28 1.48-1.12 2.73-2.4 3.58v2.97h3.88c2.27-2.09 3.51-5.17 3.51-8.75z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-2.97c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.15v3.07C3.15 21.31 7.25 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.35c-.25-.72-.39-1.49-.39-2.35s.14-1.63.39-2.35V6.58H1.15C.42 8.04 0 9.97 0 12s.42 3.96 1.15 5.42l4.13-3.07z" />
              <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0 7.25 0 3.15 2.69 1.15 6.58l4.13 3.07c.95-2.83 3.6-4.9 6.72-4.9z" />
            </svg>
            تسجيل الدخول بحساب جوجل
          </button>
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-300">
              {error}
            </div>
          )}
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
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 am:px-6 z-10 relative">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
          >
            تسجيل خروج
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl px-3 py-1.5 backdrop-blur-xl">
            <span className="text-xs text-gray-400">رمز الاستطلاع:</span>
            <span className="font-mono text-sm font-bold text-emerald-400">{pollCode}</span>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">التصويت المباشر</h1>
          <p className="mt-1.5 text-xs text-gray-400">اختر مرشحك، صوت واحد لكل مستخدم.</p>
        </div>

        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-300">
            {error}
          </div>
        )}

        {voted && (
          <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300">
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
          التصويت مشفر لحظياً، صوت واحد لكل مستخدم
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
  const styles = color === 'emerald'
    ? {
        ring: isLeader ? 'border-emerald-500/50' : 'border-white/10',
        btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      }
    : {
        ring: isLeader ? 'border-blue-500/50' : 'border-white/10',
        btn: 'bg-blue-600 hover:bg-blue-500 text-white',
      };

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-xl p-4 flex flex-col justify-between ${styles.ring}`}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800">
            <User className="h-12 w-12 text-gray-500" />
          </div>
        )}
        {isLeader && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-bold text-emerald-400 backdrop-blur">
            <Trophy className="h-3.5 w-3.5" /> المتصدر
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold text-center mb-4">{name}</h3>
      <button
        onClick={onVote}
        disabled={disabled || isVoting}
        className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${styles.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isVoting ? <Loader2 className="h-5 w-5 animate-spin" /> : disabled ? <CheckCircle2 className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
        {isVoting ? 'جاري التسجيل' : disabled ? 'تم التصويت' : 'صوت لهذا المرشح'}
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
          {isLeader && <Trophy className="mr-1 inline h-3.5 w-3.5" />}
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
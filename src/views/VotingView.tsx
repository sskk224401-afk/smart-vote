import { useEffect, useState } from 'react';
import { doc, getDoc, runTransaction, setDoc, Timestamp } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider } from '@/firebase';
import { Loader2, CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
import Background from '@/components/Background';

interface Candidate {
  name: string;
  image: string;
}

interface PollData {
  title: string;
  candidate1: Candidate;
  candidate2: Candidate;
  votes1: number;
  votes2: number;
  active: boolean;
}

interface VotingViewProps {
  pollCode: string;
  onBackHome: () => void;
}

export default function VotingView({ pollCode, onBackHome }: VotingViewProps) {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [votingFor, setVotingFor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchPoll() {
      try {
        const pollRef = doc(db, 'polls', pollCode);
        const pollSnap = await getDoc(pollRef);
        if (pollSnap.exists()) {
          setPoll(pollSnap.data() as PollData);
        } else {
          setError('الاستطلاع غير موجود');
        }
      } catch (err) {
        console.error(err);
        setError('تعذّر تحميل الاستطلاع');
      } finally {
        setLoading(false);
      }
    }
    fetchPoll();
  }, [pollCode]);

  // التحقق مما إذا كان المستخدم قد صوت من قبل
  useEffect(() => {
    async function checkVoted() {
      if (!auth.currentUser) return;
      try {
        const voteRef = doc(db, `users/${auth.currentUser.uid}/voted_polls`, pollCode);
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
          setVoted(true);
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkVoted();
  }, [pollCode, auth.currentUser]);

  const handleVote = async (candidateNum: number) => {
    if (!auth.currentUser) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    setVotingFor(candidateNum);
    setError(null);

    try {
      const pollRef = doc(db, 'polls', pollCode);
      const voteRef = doc(db, `users/${auth.currentUser!.uid}/voted_polls`, pollCode);

      const alreadyVotedSnap = await getDoc(voteRef);
      if (alreadyVotedSnap.exists()) {
        setError('لقد قمت بالتسجيل مسبقاً في هذا الاستطلاع.');
        setVoted(true);
        setVotingFor(null);
        return;
      }

      await runTransaction(db, async (tx) => {
        const pollSnap = await tx.get(pollRef);
        if (!pollSnap.exists()) throw new Error('not-found');
        const data = pollSnap.data() as PollData;
        const field = candidateNum === 1 ? 'votes1' : 'votes2';
        tx.update(pollRef, { [field]: (data[field] ?? 0) + 1 });
        tx.set(voteRef, { candidate: candidateNum, votedAt: Timestamp.now() });
      });

      setVoted(true);
    } catch (err: any) {
      console.error("تفاصيل خطأ التصويت:", err);
      setError(`خطأ: ${err.message || 'تعذّر تسجيل صوتك'}`);
    } finally {
      setVotingFor(null);
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <Background />
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // 🔒 إذا لم يقم المستخدم بتسجيل الدخول، اعرض له صفحة تسجيل الدخول أولاً قبل رؤية الاستطلاع
  if (!auth.currentUser) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 text-white">
        <Background />
        <div className="w-full max-w-md rounded-2xl bg-black/60 p-8 text-center backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">تسجيل الدخول مطلوب</h2>
          <p className="text-gray-400 text-sm mb-6">يجب عليك تسجيل الدخول بحساب جوجل أولاً للمتابعة والمشاركة في التصويت الآمن.</p>
          
          <button
            onClick={async () => {
              try {
                await signInWithPopup(auth, googleProvider);
              } catch (err) {
                console.error(err);
              }
            }}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-black hover:bg-gray-100 py-3 px-4 font-semibold transition shadow-lg"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15c1.9 3.8 5.8 8 10.4 8z"/>
            </svg>
            تسجيل الدخول بحساب جوجل
          </button>

          <button
            onClick={onBackHome}
            className="mt-4 text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowRight className="h-4 w-4" /> العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center text-white">
        <Background />
        <p className="text-xl mb-4">{error || 'الاستطلاع غير موجود'}</p>
        <button onClick={onBackHome} className="rounded-xl bg-emerald-500 px-6 py-2 font-bold text-black">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const totalVotes = (poll.votes1 || 0) + (poll.votes2 || 0);
  const p1Percent = totalVotes > 0 ? Math.round(((poll.votes1 || 0) / totalVotes) * 100) : 0;
  const p2Percent = totalVotes > 0 ? Math.round(((poll.votes2 || 0) / totalVotes) * 100) : 0;

  return (
    <div className="relative min-h-screen text-white p-6 md:p-12">
      <Background />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBackHome} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowRight className="h-5 w-5" /> الرئيسية
          </button>
          <div className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/10">
            رمز الاستطلاع: <span className="font-mono font-bold text-emerald-400">{pollCode}</span>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold sm:text-4xl mb-2">التصويت المباشر</h1>
          <p className="text-gray-400 text-sm">اختر مرشحك بحرية وآمان تام</p>
          <div className="mt-3 inline-block bg-emerald-950/60 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs text-emerald-400">
            متسجل بـ: {auth.currentUser.displayName || auth.currentUser.email}
          </div>
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-md rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {voted && (
          <div className="mx-auto mb-6 flex max-w-md items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>تم تسجيل صوتك بنجاح، شكراً لمشاركتك</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* المرشح الأول */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-gray-900">
                <img src={poll.candidate1.image} alt={poll.candidate1.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-center mb-4">{poll.candidate1.name}</h2>
            </div>
            <button
              onClick={() => handleVote(1)}
              disabled={voted || votingFor !== null}
              className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                voted
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
              }`}
            >
              {votingFor === 1 ? <Loader2 className="h-5 w-5 animate-spin" /> : voted ? <CheckCircle2 className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
              {voted ? 'تم التصويت' : 'صوت لهذا المرشح'}
            </button>
          </div>

          {/* المرشح الثاني */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-gray-900">
                <img src={poll.candidate2.image} alt={poll.candidate2.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-center mb-4">{poll.candidate2.name}</h2>
            </div>
            <button
              onClick={() => handleVote(2)}
              disabled={voted || votingFor !== null}
              className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                voted
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
              }`}
            >
              {votingFor === 2 ? <Loader2 className="h-5 w-5 animate-spin" /> : voted ? <CheckCircle2 className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
              {voted ? 'تم التصويت' : 'صوت لهذا المرشح'}
            </button>
          </div>
        </div>

        {/* النتائج المباشرة */}
        <div className="rounded-2xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-400">
            <Trophy className="h-5 w-5" /> النتائج المباشرة
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{poll.candidate1.name}</span>
                <span className="text-gray-400">{poll.votes1 || 0} صوت ({p1Percent}%)</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${p1Percent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{poll.candidate2.name}</span>
                <span className="text-gray-400">{poll.votes2 || 0} صوت ({p2Percent}%)</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${p2Percent}%` }} />
              </div>
            </div>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-6">🔒 النتائج تتحدث لحظياً. صوت واحد لكل مستخدم.</p>
        </div>
      </div>
    </div>
  );
}
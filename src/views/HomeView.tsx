import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Loader2, LogIn, Swords, Sparkles } from 'lucide-react';
import Background from '@/components/Background';

type Props = {
  onJoinPoll: (code: string) => void;
  onSecretAdmin: () => void;
};

export default function HomeView({ onJoinPoll, onSecretAdmin }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poll = params.get('poll');
    if (poll && poll.length === 5) {
      joinPoll(poll.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinPoll = async (rawCode: string) => {
    const c = rawCode.trim().toUpperCase();
    if (c.length !== 5) {
      setError('الرمز مكوّن من 5 أحرف بالضبط.');
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db, 'polls', c));
      if (!snap.exists()) {
        setError('لم يتم العثور على استطلاع بهذا الرمز.');
        setJoining(false);
        return;
      }
      onJoinPoll(c);
    } catch {
      setError('تعذّر التحقق من الرمز. حاول مرة أخرى.');
      setJoining(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinPoll(code);
  };

  const handleSecretClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 600);
    if (clickCount.current >= 10) {
      clickCount.current = 0;
      onSecretAdmin();
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <Background />

      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 cursor-default items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-neon-green">
            <Swords className="h-8 w-8 text-[#0a0a0a]" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            صوت <span className="text-emerald-400">سمارت</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">منصة التصويت المباشر الآمنة</p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-white/10 glass p-8 shadow-2xl">
          <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-emerald-400/15 to-transparent opacity-50 blur" />

          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            أدخل رمز الاستطلاع للمشاركة
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              maxLength={5}
              placeholder="مثال: AB3XK"
              dir="ltr"
              className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white placeholder-gray-700 placeholder-tracking-normal outline-none transition-all focus:border-emerald-400/50 focus:shadow-neon-green"
            />

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={joining || code.length !== 5}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-5 py-3.5 text-sm font-bold text-[#0a0a0a] shadow-neon-green transition-all hover:shadow-neon-green-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {joining ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              {joining ? 'جارٍ الدخول…' : 'انضمام'}
            </button>
          </form>
        </div>

        {/* Subtle secret trigger */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSecretClick}
            aria-label="secure"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:text-gray-600"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

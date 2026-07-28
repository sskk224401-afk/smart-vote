import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '@/firebase';
import { Loader2 } from 'lucide-react';
import Background from '@/components/Background';
import HomeView from '@/views/HomeView';
import VotingView from '@/views/VotingView';
import AdminLoginView from '@/views/AdminLoginView';
import AdminDashboardView from '@/views/AdminDashboardView';

type View = 'home' | 'voting' | 'adminLogin' | 'adminDashboard';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<View>('home');
  const [pollCode, setPollCode] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch(() => {});
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  if (!authReady) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <Background />
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const goHome = () => {
    setPollCode(null);
    setView('home');
    const url = new URL(window.location.href);
    url.searchParams.delete('poll');
    window.history.replaceState({}, '', url.toString());
  };

  const joinPoll = (code: string) => {
    setPollCode(code);
    setView('voting');
  };

  switch (view) {
    case 'voting':
      return <VotingView pollCode={pollCode!} onBackHome={goHome} />;
    case 'adminLogin':
      return <AdminLoginView onSuccess={() => setView('adminDashboard')} onBackHome={goHome} />;
    case 'adminDashboard':
      return <AdminDashboardView onBackHome={goHome} />;
    default:
      return (
        <HomeView
          onJoinPoll={joinPoll}
          onSecretAdmin={() => setView('adminLogin')}
        />
      );
  }
}

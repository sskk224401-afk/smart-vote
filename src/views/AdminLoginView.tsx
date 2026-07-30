import { useState } from 'react';

import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/firebase';

import {

  ArrowRight,

  KeyRound,

  Lock,

  ShieldCheck,

  Mail,

  Loader2,

} from 'lucide-react';

import Background from '@/components/Background';



type Props = {

  onSuccess: () => void;

  onBackHome: () => void;

};



export default function AdminLoginView({ onSuccess, onBackHome }: Props) {

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [error, setError] = useState(false);

  const [shake, setShake] = useState(false);

  const [loading, setLoading] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!email || !password) return;



    setLoading(true);

    setError(false);



    try {

      // الاتصال بسيرفر فايربيز للتحقق من البيانات

      await signInWithEmailAndPassword(auth, email, password);

      onSuccess();

    } catch (err) {

      setError(true);

      setShake(true);

      setTimeout(() => setShake(false), 500);

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">

      <Background />

      <div className="relative z-10 w-full max-w-md animate-fade-up">

        {/* زر الرجوع */}

        <button

          onClick={onBackHome}

          className="mb-8 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"

        >

          <ArrowRight className="h-5 w-5" />

          رجوع للرئيسية

        </button>



        {/* لوحة تسجيل الدخول */}

        <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-8 shadow-2xl backdrop-blur-xl">

          <div className="mb-6 flex justify-center">

            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/20 p-4">

              <ShieldCheck className="h-10 w-10 text-emerald-400" />

            </div>

          </div>



          <h1 className="mb-2 text-center text-2xl font-bold text-white">

            لوحة المسؤول

          </h1>

          <p className="mb-8 text-center text-sm text-gray-400">

            سجل دخولك لإدارة الاستطلاعات

          </p>



          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">

            <div className="space-y-4">

              {/* حقل الإيميل */}

              <div className="relative">

                <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                <input

                  type="email"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  placeholder="البريد الإلكتروني"

                  className="w-full rounded-xl border border-white/10 bg-ink-950/50 py-4 pl-4 pr-12 text-white transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"

                  dir="ltr"

                  style={{ textAlign: 'right' }}

                />

              </div>



              {/* حقل كلمة السر */}

              <div

                className={`relative transition-transform ${

                  shake ? 'animate-shake' : ''

                }`}

              >

                <KeyRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                <input

                  type="password"

                  value={password}

                  onChange={(e) => setPassword(e.target.value)}

                  placeholder="كلمة المرور"

                  className={`w-full rounded-xl border bg-ink-950/50 py-4 pl-4 pr-12 text-white transition-all focus:outline-none ${

                    error

                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50'

                      : 'border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50'

                  }`}

                  dir="ltr"

                  style={{ textAlign: 'right' }}

                />

              </div>

            </div>



            {error && (

              <p className="text-center text-sm text-red-400">

                البيانات غير صحيحة، يرجى المحاولة مرة أخرى.

              </p>

            )}



            <button

              type="submit"

              disabled={loading || !email || !password}

              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 font-bold text-white shadow-neon-green transition-all hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"

            >

              {loading ? (

                <Loader2 className="h-5 w-5 animate-spin" />

              ) : (

                <>

                  <Lock className="h-5 w-5" />

                  تسجيل الدخول

                </>

              )}

            </button>

          </form>

        </div>

      </div>

    </div>

  );

} 

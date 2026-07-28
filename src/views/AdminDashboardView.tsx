import { useRef, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { generatePollCode, resizeImageToBase64 } from '@/lib/poll';
import {
  ArrowRight,
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Swords,
  Upload,
  X,
} from 'lucide-react';
import Background from '@/components/Background';

type Props = {
  onBackHome: () => void;
};

type CandidateForm = {
  name: string;
  image: string;
  fileName: string | null;
};

const empty: CandidateForm = { name: '', image: '', fileName: null };

export default function AdminDashboardView({ onBackHome }: Props) {
  const [c1, setC1] = useState<CandidateForm>(empty);
  const [c2, setC2] = useState<CandidateForm>(empty);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImage = async (
    file: File | undefined,
    setter: (c: CandidateForm) => void,
    current: CandidateForm,
  ) => {
    if (!file) return;
    setError(null);
    try {
      const base64 = await resizeImageToBase64(file, 500, 0.85);
      setter({ ...current, image: base64, fileName: file.name });
    } catch {
      setError('تعذّر معالجة الصورة. حاول بصورة أخرى.');
    }
  };

  const clearImage = (setter: (c: CandidateForm) => void, current: CandidateForm) => {
    setter({ ...current, image: '', fileName: null });
  };

  const handleCreate = async () => {
    setError(null);
    if (!c1.name.trim() || !c2.name.trim()) {
      setError('الرجاء إدخال اسمي المرشّحين.');
      return;
    }
    if (!c1.image || !c2.image) {
      setError('الرجاء رفع صورة لكل مرشّح.');
      return;
    }
    setCreating(true);
    try {
      const code = generatePollCode(5);
      await setDoc(doc(db, 'polls', code), {
        candidate1Name: c1.name.trim(),
        candidate1Image: c1.image,
        candidate2Name: c2.name.trim(),
        candidate2Image: c2.image,
        votes1: 0,
        votes2: 0,
        createdAt: Date.now(),
      });
      setCreatedCode(code);
    } catch {
      setError('تعذّر إنشاء الاستطلاع. حاول مرة أخرى.');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    if (!createdCode) return;
    const link = `${window.location.origin}/?poll=${createdCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setCreatedCode(null);
    setC1(empty);
    setC2(empty);
    setCopied(false);
  };

  return (
    <div className="relative min-h-screen">
      <Background />

      <div className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <button
            onClick={onBackHome}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
          <span className="flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            لوحة المسؤول
          </span>
        </div>

        <div className="mt-6 text-center animate-fade-up">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">إنشاء استطلاع جديد</h1>
          <p className="mt-1.5 text-sm text-gray-500">أدخل بيانات المرشّحين وارفع صورهما لبدء التصويت.</p>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300 animate-scale-in">
            {error}
          </div>
        )}

        {/* Success screen */}
        {createdCode ? (
          <div className="mx-auto mt-10 max-w-lg animate-scale-in">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 glass p-8 text-center shadow-2xl">
              <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-emerald-400/20 to-transparent blur" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
                <Check className="h-8 w-8 text-emerald-300" />
              </div>
              <h2 className="text-xl font-bold text-white">تم إنشاء الاستطلاع!</h2>
              <p className="mt-2 text-sm text-gray-400">شارك هذا الرمز مع المشاركين:</p>

              <div className="mt-5 rounded-xl border border-white/10 bg-ink-950 px-6 py-5">
                <p className="font-mono text-4xl font-bold tracking-[0.3em] text-emerald-400">
                  {createdCode}
                </p>
              </div>

              <button
                onClick={copyLink}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-5 py-3.5 text-sm font-bold text-[#0a0a0a] shadow-neon-green transition-all hover:shadow-neon-green-lg active:scale-[0.98]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'تم النسخ!' : 'نسخ رابط المشاركة'}
              </button>

              <button
                onClick={reset}
                className="mt-3 text-sm text-gray-500 transition-colors hover:text-white"
              >
                إنشاء استطلاع آخر
              </button>
            </div>
          </div>
        ) : (
          /* Create form */
          <div className="mt-8 animate-fade-up">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CandidateInput
                index={1}
                color="emerald"
                form={c1}
                setForm={setC1}
                onImage={(f) => handleImage(f, setC1, c1)}
                onClear={() => clearImage(setC1, c1)}
              />
              <CandidateInput
                index={2}
                color="blue"
                form={c2}
                setForm={setC2}
                onImage={(f) => handleImage(f, setC2, c2)}
                onClear={() => clearImage(setC2, c2)}
              />
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-8 py-4 text-sm font-bold text-[#0a0a0a] shadow-neon-green transition-all hover:shadow-neon-green-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {creating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Swords className="h-5 w-5" />
                )}
                {creating ? 'جارٍ الإنشاء…' : 'إنشاء الاستطلاع'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateInput({
  index,
  color,
  form,
  setForm,
  onImage,
  onClear,
}: {
  index: number;
  color: 'emerald' | 'blue';
  form: CandidateForm;
  setForm: (c: CandidateForm) => void;
  onImage: (f: File | undefined) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const accent =
    color === 'emerald'
      ? 'text-emerald-400 border-emerald-400/30'
      : 'text-blue-400 border-blue-400/30';

  return (
    <div className={`rounded-2xl border bg-ink-900/40 p-5 ${accent}`}>
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-[#0a0a0a] ${
            color === 'emerald' ? 'bg-emerald-400' : 'bg-blue-400'
          }`}
        >
          {index}
        </span>
        <h3 className={`text-sm font-bold ${color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}`}>
          المرشّح {index === 1 ? 'الأول' : 'الثاني'}
        </h3>
      </div>

      {/* Image upload */}
      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => onImage(e.target.files?.[0])}
          className="hidden"
        />
        {form.image ? (
          <div className="group relative overflow-hidden rounded-xl border border-white/10">
            <img src={form.image} alt="معاينة" className="aspect-[4/3] w-full object-cover" />
            <button
              onClick={onClear}
              className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a0a]/80 text-white backdrop-blur transition-colors hover:bg-red-500/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
          >
            <Upload className="h-7 w-7" />
            <span className="text-xs">رفع صورة (٥٠٠ بكسل)</span>
          </button>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500">اسم المرشّح</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="مثال: أحمد محمد"
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white placeholder-gray-700 outline-none transition-colors focus:border-white/20"
        />
      </div>
    </div>
  );
}

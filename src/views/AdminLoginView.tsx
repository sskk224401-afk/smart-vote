import React, { useState } from 'react';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Trophy, Upload, Image as ImageIcon, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import Background from '@/components/Background';

// 1. دالة ضغط الصور وتحويلها لـ Base64 بدقة عالية وحجم خفيف
const compressAndConvertToBase64 = (
  file: File, 
  maxWidth = 800, 
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('فشل الوصول لـ Canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};

export default function AdminView() {
  const [pollCode, setPollCode] = useState('');
  const [candidate1Name, setCandidate1Name] = useState('');
  const [candidate1Image, setCandidate1Image] = useState('');
  const [candidate2Name, setCandidate2Name] = useState('');
  const [candidate2Image, setCandidate2Image] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // دالة التعامل مع رفع واختيار الصور
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    candidateNumber: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      // ضغط الصورة وتحويلها
      const base64 = await compressAndConvertToBase64(file);
      
      if (candidateNumber === 1) {
        setCandidate1Image(base64);
      } else {
        setCandidate2Image(base64);
      }
    } catch (err) {
      console.error("خطأ معالجة الصورة:", err);
      setError('حدث خطأ أثناء معالجة الصورة، حاول اختيار صورة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // توليد رمز استطلاع عشوائي
  const generateRandomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPollCode(code);
  };

  // حفظ الاستطلاع في Firestore
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollCode || !candidate1Name || !candidate2Name) {
      setError('يرجى ملء كافة البيانات المطلوبة.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const pollRef = doc(db, 'polls', pollCode);
      await setDoc(pollRef, {
        candidate1Name,
        candidate1Image,
        candidate2Name,
        candidate2Image,
        votes1: 0,
        votes2: 0,
        createdAt: Date.now()
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("خطأ حفظ الاستطلاع:", err);
      setError(`فشل إنشاء الاستطلاع: ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white bg-black p-4 flex items-center justify-center">
      <Background />
      
      <div className="w-full max-w-2xl rounded-3xl bg-black/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">إنشاء استطلاع جديد</h1>
          <p className="text-xs text-gray-400 mt-1">أدخل أسماء وصور المرشحين وسيتم ضغط الصور وحفظها تلقائياً.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-300">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">تم إنشاء الاستطلاع بنجاح!</h2>
            <p className="text-sm text-gray-400">رمز المشاركة الخاص بالاستطلاع هو:</p>
            <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 px-6 py-2.5 rounded-2xl font-mono text-2xl font-bold text-emerald-400 tracking-wider">
              {pollCode}
            </div>
            <div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setPollCode('');
                  setCandidate1Name('');
                  setCandidate1Image('');
                  setCandidate2Name('');
                  setCandidate2Image('');
                }}
                className="mt-4 px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition text-sm cursor-pointer"
              >
                إنشاء استطلاع آخر
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreatePoll} className="space-y-6">
            {/* رمز الاستطلاع */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">رمز الاستطلاع (Poll Code)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pollCode}
                  onChange={(e) => setPollCode(e.target.value)}
                  placeholder="مثال: 582941"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" /> توليد رمز
                </button>
              </div>
            </div>

            {/* المرشح الأول */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400">المرشح الأول</h3>
              <input
                type="text"
                placeholder="اسم المرشح الأول"
                value={candidate1Name}
                onChange={(e) => setCandidate1Name(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 py-3 rounded-xl cursor-pointer text-xs transition">
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span>{candidate1Image ? 'تغيير الصورة' : 'رفع صورة المرشح'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 1)}
                    className="hidden"
                  />
                </label>
                {candidate1Image && (
                  <img src={candidate1Image} alt="المرشح 1" className="h-12 w-12 rounded-xl object-cover border border-emerald-500/40" />
                )}
              </div>
            </div>

            {/* المرشح الثاني */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-blue-400">المرشح الثاني</h3>
              <input
                type="text"
                placeholder="اسم المرشح الثاني"
                value={candidate2Name}
                onChange={(e) => setCandidate2Name(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 py-3 rounded-xl cursor-pointer text-xs transition">
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span>{candidate2Image ? 'تغيير الصورة' : 'رفع صورة المرشح'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 2)}
                    className="hidden"
                  />
                </label>
                {candidate2Image && (
                  <img src={candidate2Image} alt="المرشح 2" className="h-12 w-12 rounded-xl object-cover border border-blue-500/40" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إنشاء وحفظ الاستطلاع'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Building2, Lock, User, ReceiptText, MessageCircle, Wallet } from 'lucide-react';
import { api, Spinner } from '@/components/ui';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/api/auth/login', 'POST', { username, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-brand-900 to-indigo-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2.5 ring-1 ring-white/20">
            <Building2 className="h-7 w-7" />
          </div>
          <span className="text-xl font-extrabold">Kost Manager</span>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Kelola pembayaran kost
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-cyan-300 bg-clip-text text-transparent">lebih mudah & rapi.</span>
          </h2>
          <div className="mt-10 space-y-4">
            {[
              [ReceiptText, 'Tagihan otomatis sesuai tanggal masuk penghuni'],
              [MessageCircle, 'Pengingat & kwitansi langsung ke WhatsApp'],
              [Wallet, 'Laporan pemasukan, pengeluaran & laba'],
            ].map(([I, t]: any) => (
              <div key={t} className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/10">
                  <I className="h-5 w-5 text-brand-200" />
                </div>
                <span className="text-brand-50">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div className="flex items-center gap-3">
            <img
              src="/creator-logo.jpg"
              alt="Logo ardev"
              className="h-11 w-11 rounded-xl bg-black object-cover ring-1 ring-white/20"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-200/70">Dibuat oleh</p>
              <p className="text-sm font-extrabold text-white">ardev</p>
            </div>
          </div>
          <p className="text-xs text-brand-200/70">© {new Date().getFullYear()} Kost Manager</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-6">
        <form onSubmit={submit} className="card w-full max-w-md animate-fade-up p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600 lg:hidden">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Selamat datang 👋</h1>
            <p className="mt-1 text-sm text-slate-500">Masuk ke panel pengelola kost</p>
          </div>
          {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</div>}
          <div className="space-y-4">
            <div>
              <span className="label">Username</span>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input className="input pl-10" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>
            <div>
              <span className="label">Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input type="password" className="input pl-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
          </div>
          <button className="btn-primary mt-6 w-full py-3" disabled={loading}>
            {loading && <Spinner className="h-4 w-4" />} Masuk
          </button>
          <p className="mt-5 text-center text-xs text-slate-400">Default: admin / admin123 (ubah di file .env)</p>
        </form>
      </div>
    </div>
  );
}

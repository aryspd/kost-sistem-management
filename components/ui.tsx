// components/ui.tsx — komponen UI dasar
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

/* ---------------- fetch helper ---------------- */
export async function api<T = any>(url: string, method = 'GET', body?: any): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) window.location.href = '/login';
  if (!res.ok) throw new Error(json?.message || 'Terjadi kesalahan');
  return json;
}

export function useData<T = any>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      setData(await api<T>(url));
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, loading, error, reload, setData };
}

/* ---------------- toast ---------------- */
type Toast = { id: number; type: 'success' | 'error' | 'info'; text: string };
const ToastCtx = createContext<(type: Toast['type'], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((type: Toast['type'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const color = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-brand-200 bg-brand-50 text-brand-800',
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((t) => {
          const I = icon[t.type];
          return (
            <div key={t.id} className={`animate-fade-up flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${color[t.type]}`}>
              <I className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{t.text}</p>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`animate-fade-up max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- misc ---------------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const STATE_STYLE: Record<string, [string, string]> = {
  LUNAS: ['Lunas', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  TERLAMBAT: ['Terlambat', 'bg-rose-50 text-rose-700 ring-rose-600/20'],
  JATUH_TEMPO: ['Segera Jatuh Tempo', 'bg-amber-50 text-amber-700 ring-amber-600/20'],
  BELUM_BAYAR: ['Belum Bayar', 'bg-slate-100 text-slate-600 ring-slate-500/20'],
  AKTIF: ['Aktif', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  KELUAR: ['Keluar', 'bg-slate-100 text-slate-500 ring-slate-500/20'],
};

export function StateBadge({ state }: { state: string }) {
  const [label, cls] = STATE_STYLE[state] || [state, 'bg-slate-100 text-slate-600 ring-slate-500/20'];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: any; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-brand-50 p-4 text-brand-600">
        <Icon className="h-8 w-8" />
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <div className={`h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

export function LoadingBlock() {
  return (
    <div className="space-y-3 p-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const colors = ['from-brand-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-pink-500 to-rose-500', 'from-violet-500 to-purple-500'];
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const ini = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${c} ${className}`}>
      {ini}
    </div>
  );
}

/* ---------------- WhatsApp result handler ---------------- */
const WaCtx = createContext<(wa: any) => void>(() => {});
/** Tangani hasil kirim WA: tampilkan tombol buka wa.me (mode link) atau toast (mode otomatis) */
export const useWa = () => useContext(WaCtx);

export function WaProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [wa, setWa] = useState<any>(null);
  const show = useCallback(
    (r: any) => {
      if (!r) return;
      if (r.mode === 'auto' && r.ok) return toast('success', 'Pesan WhatsApp terkirim otomatis ✔');
      if (r.mode === 'auto' && !r.ok) toast('error', `Gagal kirim otomatis: ${r.error}`);
      setWa(r);
    },
    [toast],
  );
  const text = wa ? decodeURIComponent(wa.link.split('?text=')[1] || '') : '';
  return (
    <WaCtx.Provider value={show}>
      {children}
      <Modal open={!!wa} onClose={() => setWa(null)} title="Kirim via WhatsApp" subtitle="Pesan sudah disiapkan, tinggal kirim.">
        <div className="mb-5 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-[#e7fbe9] p-4 text-sm leading-relaxed text-slate-800 ring-1 ring-green-200">
          {text}
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={() => setWa(null)}>
            Tutup
          </button>
          <a href={wa?.link} target="_blank" rel="noreferrer" className="btn-wa flex-1" onClick={() => setTimeout(() => setWa(null), 300)}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c.7.3 1.3.5 1.7.6a4.2 4.2 0 0 0 1.9.1 3.2 3.2 0 0 0 2.1-1.5 2.6 2.6 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.3M12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8M20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.2 24l6.4-1.7A11.8 11.8 0 0 0 24 12a11.7 11.7 0 0 0-3.5-8.5" /></svg>
            Buka WhatsApp
          </a>
        </div>
      </Modal>
    </WaCtx.Provider>
  );
}
